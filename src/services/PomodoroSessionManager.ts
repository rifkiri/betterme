import { toast } from 'sonner';
import { SupabaseActivePomodoroService, ActivePomodoroSession } from '@/services/SupabaseActivePomodoroService';
import { SupabasePomodoroService } from '@/services/SupabasePomodoroService';
import { PomodoroGlobalState } from '@/hooks/usePomodoroGlobalState';

// Event system for real-time counter updates
type PomodoroEventType = 'session_completed' | 'session_started' | 'session_terminated';
interface PomodoroEvent {
  type: PomodoroEventType;
  sessionId?: string;
  taskId?: string;
  sessionType?: string;
}

class PomodoroEventEmitter {
  private listeners: { [K in PomodoroEventType]?: Array<(event: PomodoroEvent) => void> } = {};

  on(event: PomodoroEventType, callback: (event: PomodoroEvent) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback);
  }

  emit(event: PomodoroEventType, data: Omit<PomodoroEvent, 'type'>) {
    const listeners = this.listeners[event];
    if (listeners) {
      listeners.forEach(callback => callback({ type: event, ...data }));
    }
  }

  off(event: PomodoroEventType, callback: (event: PomodoroEvent) => void) {
    const listeners = this.listeners[event];
    if (listeners) {
      this.listeners[event] = listeners.filter(cb => cb !== callback);
    }
  }
}

export const pomodoroEventEmitter = new PomodoroEventEmitter();

export interface PomodoroSessionSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
}

const DEFAULT_SETTINGS: PomodoroSessionSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  soundEnabled: true,
  notificationsEnabled: true,
  autoStartBreaks: false,
  autoStartWork: false,
};

const SETTINGS_KEY = 'pomodoro-settings';

// Singleton service to manage Pomodoro sessions
export class PomodoroSessionManager {
  private static instance: PomodoroSessionManager;
  private listeners: Set<() => void> = new Set();
  private currentUser: { id: string } | null = null;
  private activeSession: ActivePomodoroSession | null = null;
  private settings: PomodoroSessionSettings = DEFAULT_SETTINGS;
  private isRunning: boolean = false;
  private timeRemaining: number = 0;
  private intervalRef: NodeJS.Timeout | null = null;
  private audioRef: HTMLAudioElement | null = null;
  private globalState: PomodoroGlobalState;
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;
  private isCompleting: boolean = false;
  private completedSessions: Set<string> = new Set();
  private savedSessions: Set<string> = new Set();

  static getInstance(): PomodoroSessionManager {
    if (!PomodoroSessionManager.instance) {
      PomodoroSessionManager.instance = new PomodoroSessionManager();
    }
    return PomodoroSessionManager.instance;
  }

  private constructor() {
    this.globalState = PomodoroGlobalState.getInstance();
    this.loadSettings();
    
    // Listen to global session changes
    this.globalState.subscribe((session) => {
      if (session !== this.activeSession) {
        this.syncWithGlobalSession(session);
      }
    });
  }

  private syncWithGlobalSession(globalSession: ActivePomodoroSession | null) {
    this.activeSession = globalSession;
    
    if (globalSession) {
      console.log('Syncing with global session:', globalSession.session_status, 'saved time:', globalSession.current_time_remaining);
      
      // Always restore saved time when resuming from paused state
      if (globalSession.session_status === 'active-paused' && 
          globalSession.current_time_remaining !== null && 
          globalSession.current_time_remaining !== undefined) {
        console.log('Restoring paused time:', globalSession.current_time_remaining);
        this.timeRemaining = Math.max(0, globalSession.current_time_remaining);
      }
      // For stopped sessions, restore saved time (full duration) with validation
      else if (globalSession.session_status === 'active-stopped') {
        if (globalSession.current_time_remaining !== null && 
            globalSession.current_time_remaining !== undefined) {
          console.log('Restoring stopped session time:', globalSession.current_time_remaining);
          this.timeRemaining = Math.max(0, globalSession.current_time_remaining);
        } else {
          // Fallback: calculate correct duration if not set
          const expectedDuration = this.calculateSessionDuration(globalSession.current_session_type);
          console.log('Setting fallback duration for stopped session:', expectedDuration);
          this.timeRemaining = expectedDuration;
        }
      }
      // For running sessions, restore saved time if available
      else if (globalSession.session_status === 'active-running' &&
               globalSession.current_time_remaining !== null && 
               globalSession.current_time_remaining !== undefined) {
        console.log('Restoring running session time:', globalSession.current_time_remaining);
        this.timeRemaining = globalSession.current_time_remaining;
      }
      // For running sessions, only update if it's a new session or we don't have a current session
      else if (!this.isRunning || !this.activeSession || globalSession.id !== this.activeSession.id) {
        if (globalSession.current_time_remaining !== null && globalSession.current_time_remaining !== undefined) {
          this.timeRemaining = globalSession.current_time_remaining;
        }
      }
      
      // Update running state based on session status
      this.isRunning = globalSession.session_status === 'active-running';
    } else {
      // Session terminated globally
      this.isRunning = false;
      this.timeRemaining = 0;
      this.clearTimer();
    }
    
    this.notifyListeners();
    this.updateTimer();
  }

  private loadSettings() {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
    }
  }

  private saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
  }

  async initializeForUser(userId: string) {
    if (this.isInitialized || this.isInitializing || this.currentUser?.id === userId) {
      return;
    }

    this.isInitializing = true;
    this.currentUser = { id: userId };

    try {
      // Check if there's already a global session
      if (this.globalState.getCurrentSession()) {
        this.isInitialized = true;
        this.isInitializing = false;
        return;
      }

      // Step 1: Auto-cleanup stale sessions (background process)
      try {
        const cleanedCount = await SupabaseActivePomodoroService.cleanupStaleSessionsForUser(userId, 24);
        if (cleanedCount > 0) {
          console.log(`Auto-cleaned ${cleanedCount} stale Pomodoro sessions`);
        }
      } catch (error) {
        console.error('Error during auto-cleanup:', error);
      }

      // Step 2: Load only recent active sessions (48 hours max)
      const sessions = await SupabaseActivePomodoroService.getActiveSessionsByUser(userId, 48);
      
      if (sessions.length > 0) {
        const runningSession = sessions.find(s => s.session_status === 'active-running');
        const pausedSession = sessions.find(s => s.session_status === 'active-paused');
        
        if (runningSession && runningSession.current_start_time) {
          // Calculate accurate remaining time
          const elapsed = Math.floor((Date.now() - new Date(runningSession.current_start_time).getTime()) / 1000);
          const totalDuration = this.getSessionDuration(runningSession.current_session_type, runningSession);
          const remaining = Math.max(0, totalDuration - elapsed);
          
          const sessionWithAccurateTime = { ...runningSession, current_time_remaining: remaining };
          this.globalState.updateSession(sessionWithAccurateTime, true);
        } else if (pausedSession) {
          // Step 3: Smart notifications with age context and dismiss option
          const ageHours = SupabaseActivePomodoroService.calculateSessionAge(pausedSession);
          const ageText = this.formatSessionAge(ageHours);
          
          toast.info(`Timer paused ${ageText} ago. Resume or dismiss?`, {
            action: {
              label: 'Resume',
              onClick: () => this.resumeSession(pausedSession.id),
            },
            cancel: {
              label: 'Dismiss',
              onClick: () => this.terminateSessionById(pausedSession.id),
            },
          });
        }
      }
    } catch (error) {
      console.error('Error initializing session manager:', error);
    } finally {
      this.isInitialized = true;
      this.isInitializing = false;
    }
  }

  private getSessionDuration(sessionType: string, session: ActivePomodoroSession): number {
    switch (sessionType) {
      case 'work': return session.work_duration * 60;
      case 'short_break': return session.short_break_duration * 60;
      case 'long_break': return session.long_break_duration * 60;
      default: return 0;
    }
  }

  private calculateSessionDuration(sessionType: string, breakType?: 'short_break' | 'long_break'): number {
    switch (sessionType) {
      case 'work': return this.settings.workDuration * 60;
      case 'short_break': return this.settings.shortBreakDuration * 60;
      case 'long_break': return this.settings.longBreakDuration * 60;
      default: return 0;
    }
  }

  private clearTimer() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
  }

  private updateTimer() {
    this.clearTimer();
    
    if (this.isRunning && this.activeSession && this.timeRemaining > 0) {
      this.intervalRef = setInterval(() => {
        this.timeRemaining = Math.max(0, this.timeRemaining - 1);
        if (this.timeRemaining <= 0) {
          this.handleSessionComplete();
        }
        this.notifyListeners();
      }, 1000);
    }
  }

  private async handleSessionComplete() {
    if (!this.activeSession || !this.currentUser || this.isCompleting) return;
    
    // Prevent duplicate completion of the same session
    const sessionKey = `${this.activeSession.id}-${this.activeSession.current_session_type}`;
    if (this.completedSessions.has(sessionKey)) {
      console.log('🚫 Session already completed:', sessionKey);
      return;
    }
    
    this.isCompleting = true;
    // NOTE: completedSessions.add() moved to end of method after all operations succeed

    console.log('📊 Session completing - current counters:', {
      work: this.activeSession.completed_work_sessions,
      break: this.activeSession.completed_break_sessions,
      sessionType: this.activeSession.current_session_type
    });

    this.isRunning = false;
    this.clearTimer();
    this.playSound();

    let completionError: any = null;
    
    try {
      // Save completed session to history with proper cumulative numbering
      const isWorkSession = this.activeSession.current_session_type === 'work';
      const currentWorkSessions = this.activeSession.completed_work_sessions;
      const currentBreakSessions = this.activeSession.completed_break_sessions;
      
      // Calculate proper cumulative pomodoro and break numbers
      let cumulativePomodoroNumber = 1;
      let cumulativeBreakNumber = 0;
      
      if (this.activeSession.task_id) {
        // Import TaskPomodoroStatsService to get cumulative counts
        const { TaskPomodoroStatsService } = await import('@/services/TaskPomodoroStatsService');
        
        if (isWorkSession) {
          // Get next cumulative pomodoro number for this task
          cumulativePomodoroNumber = await TaskPomodoroStatsService.getNextPomodoroNumber(
            this.activeSession.task_id, 
            this.currentUser.id
          );
        } else {
          // For breaks, get current cumulative work session count
          const stats = await TaskPomodoroStatsService.getTaskStats(
            this.activeSession.task_id, 
            this.currentUser.id
          );
          cumulativePomodoroNumber = stats.totalWorkSessions;
          cumulativeBreakNumber = stats.totalBreakSessions + 1;
        }
      } else {
        // For non-task sessions, use session-level counters
        cumulativePomodoroNumber = isWorkSession ? currentWorkSessions + 1 : currentWorkSessions;
        cumulativeBreakNumber = !isWorkSession ? currentBreakSessions + 1 : currentBreakSessions;
      }
      
      await this.saveSessionOnce({
        user_id: this.currentUser.id,
        task_id: this.activeSession.task_id,
        session_id: this.activeSession.session_id,
        duration_minutes: this.getCurrentSessionDuration(),
        session_type: this.activeSession.current_session_type as any,
        session_status: 'completed',
        pomodoro_number: cumulativePomodoroNumber,
        break_number: cumulativeBreakNumber,
        completed_at: new Date().toISOString(),
      }, 'handleSessionComplete');
      console.log('💾 Session saved to history with cumulative numbers:', {
        type: this.activeSession.current_session_type,
        cumulative_pomodoro: cumulativePomodoroNumber,
        cumulative_break: cumulativeBreakNumber,
        taskId: this.activeSession.task_id
      });

      if (isWorkSession) {
        this.showNotification('Work Session Complete!', `Great job! You've completed ${this.getCurrentSessionDuration()} minutes of focused work.`);
        
        const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(this.activeSession.id, {
          completed_work_sessions: this.activeSession.completed_work_sessions + 1,
        });
        console.log('📈 Work session completed - new count:', updatedSession.completed_work_sessions);
        this.activeSession = updatedSession;
        this.globalState.updateSession(updatedSession, true);
        this.notifyListeners(); // Notify immediately after work session completion
        
        // Emit event for real-time counter updates
        pomodoroEventEmitter.emit('session_completed', {
          sessionId: this.activeSession.session_id,
          taskId: this.activeSession.task_id,
          sessionType: 'work'
        });
        
        if (this.settings.autoStartBreaks) {
          const breakType = this.determineNextBreakType(updatedSession.completed_work_sessions, updatedSession.sessions_until_long_break);
          this.startBreak(breakType);
        } else {
          const nextBreakType = this.determineNextBreakType(updatedSession.completed_work_sessions, updatedSession.sessions_until_long_break);
          const breakDuration = this.calculateSessionDuration(nextBreakType);
          const stoppedSession = await SupabaseActivePomodoroService.updateActiveSession(this.activeSession.id, {
            session_status: 'active-stopped',
            current_session_type: nextBreakType,
            current_time_remaining: breakDuration,
          });
          this.activeSession = stoppedSession;
          this.timeRemaining = breakDuration;
          this.globalState.updateSession(stoppedSession, true);
        }
      } else {
        this.showNotification('Break Complete!', 'Break time is over. Ready to get back to work?');
        
        const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(this.activeSession.id, {
          completed_break_sessions: this.activeSession.completed_break_sessions + 1,
        });
        console.log('🛀 Break session completed - new count:', updatedSession.completed_break_sessions);
        this.activeSession = updatedSession;
        this.globalState.updateSession(updatedSession, true);
        this.notifyListeners(); // Notify immediately after break session completion
        
        if (this.settings.autoStartWork) {
          this.startWork();
        } else {
          const workDuration = this.calculateSessionDuration('work');
          const stoppedSession = await SupabaseActivePomodoroService.updateActiveSession(this.activeSession.id, {
            session_status: 'active-stopped',
            current_session_type: 'work',
            current_time_remaining: workDuration,
          });
          this.activeSession = stoppedSession;
          this.timeRemaining = workDuration;
          this.globalState.updateSession(stoppedSession, true);
        }
      }
    } catch (error) {
      completionError = error;
      console.error('Error handling session completion:', error);
      toast.error('Error saving session completion');
      // Don't mark as completed if there was an error
    } finally {
      this.isCompleting = false;
      
      // Only mark session as completed if no error occurred
      if (!completionError) {
        this.completedSessions.add(sessionKey);
        console.log('✅ Session marked as completed successfully:', sessionKey);
        
        // Clean up completed session tracking after successful completion
        setTimeout(() => this.completedSessions.delete(sessionKey), 5000);
      }
    }
    
    this.notifyListeners();
  }

  private getCurrentSessionDuration(): number {
    if (!this.activeSession) return 0;
    switch (this.activeSession.current_session_type) {
      case 'work': return this.settings.workDuration;
      case 'short_break': return this.settings.shortBreakDuration;
      case 'long_break': return this.settings.longBreakDuration;
      default: return 0;
    }
  }

  private playSound() {
    if (!this.settings.soundEnabled) return;

    try {
      if (!this.audioRef) {
        this.audioRef = new Audio();
        this.audioRef.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAZA0GV2+/Zfy4NHHzN6d+BNAIWXrnn7qFAEx9g';
      }
      this.audioRef.currentTime = 0;
      this.audioRef.play().catch(() => {}); // Ignore errors
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  private showNotification(title: string, body: string) {
    if (this.settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
    toast.success(title, { description: body });
  }

  // Public methods
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Subscribe to Pomodoro events (for counter updates)
  subscribeToEvents(event: PomodoroEventType, callback: (event: PomodoroEvent) => void): (() => void) {
    pomodoroEventEmitter.on(event, callback);
    return () => {
      pomodoroEventEmitter.off(event, callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback());
  }

  getState() {
    // Ensure we return the most current session state by checking global state
    const globalSession = this.globalState.getCurrentSession();
    const currentSession = globalSession || this.activeSession;
    
    console.log('🔄 getState called - returning session with counters:', {
      work: currentSession?.completed_work_sessions || 0,
      break: currentSession?.completed_break_sessions || 0,
      sessionId: currentSession?.id?.substring(0, 8) || 'none'
    });
    
    return {
      activeSession: currentSession,
      settings: this.settings,
      isRunning: this.isRunning,
      timeRemaining: this.timeRemaining,
    };
  }

  async createSession(taskId?: string, taskTitle?: string): Promise<ActivePomodoroSession | null> {
    if (!this.currentUser?.id) return null;

    try {
      // Step 1: Check for and terminate any existing active sessions
      const existingSessions = await SupabaseActivePomodoroService.getActiveSessionsByUser(this.currentUser.id);
      
      for (const session of existingSessions) {
        if (session.session_status !== 'terminated') {
          await this.terminateExistingSession(session);
        }
      }

      // Clear tracking sets for new session
      this.savedSessions.clear();
      this.completedSessions.clear();
      console.log('🧹 Cleared session tracking for new session');

      // Step 2: Create new session after cleanup
      const newSession = await SupabaseActivePomodoroService.createActiveSession({
        user_id: this.currentUser.id,
        task_id: taskId,
        session_id: crypto.randomUUID(),
        task_title: taskTitle,
        session_status: 'active-stopped',
        current_session_type: 'work',
        work_duration: this.settings.workDuration,
        short_break_duration: this.settings.shortBreakDuration,
        long_break_duration: this.settings.longBreakDuration,
        sessions_until_long_break: this.settings.sessionsUntilLongBreak,
        completed_work_sessions: 0,
        completed_break_sessions: 0,
        is_card_visible: true,
        is_floating_visible: false,
      });

      this.globalState.updateSession(newSession, true);
      this.timeRemaining = newSession.work_duration * 60;
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Error creating Pomodoro session');
      return null;
    }
  }

  private async terminateExistingSession(session: ActivePomodoroSession): Promise<void> {
    try {
      // Save any incomplete work if session was running or paused
      if (session.session_status === 'active-running' || session.session_status === 'active-paused') {
        await this.saveInterruptedSessionForSession(session);
        console.log(`💾 Saved interrupted session for task: ${session.task_title || 'No task'}`);
      }
      
      // Terminate the session in database
      await SupabaseActivePomodoroService.terminateSession(session.id);
      console.log(`🔄 Terminated previous session for task: ${session.task_title || 'No task'}`);
    } catch (error) {
      console.error('Error terminating existing session:', error);
    }
  }

  private async saveInterruptedSessionForSession(session: ActivePomodoroSession): Promise<void> {
    if (!this.currentUser?.id) return;

    try {
      let elapsedTime = 0;
      
      // Calculate elapsed time based on session status
      if (session.session_status === 'active-running' && session.current_start_time) {
        const startTime = new Date(session.current_start_time).getTime();
        const currentTime = Date.now();
        elapsedTime = Math.floor((currentTime - startTime) / 1000 / 60); // Convert to minutes
      } else if (session.session_status === 'active-paused' && session.current_time_remaining) {
        const totalDuration = this.getSessionDuration(session.current_session_type, session) / 60;
        elapsedTime = totalDuration - Math.floor(session.current_time_remaining / 60);
      }
      
      // Only save if there's meaningful elapsed time (at least 1 minute)
      if (elapsedTime >= 1) {
        const isWorkSession = session.current_session_type === 'work';
        let cumulativePomodoroNumber = 1;
        let cumulativeBreakNumber = 0;
        
        if (session.task_id) {
          const { TaskPomodoroStatsService } = await import('@/services/TaskPomodoroStatsService');
          
          if (isWorkSession) {
            cumulativePomodoroNumber = await TaskPomodoroStatsService.getNextPomodoroNumber(
              session.task_id, 
              this.currentUser.id
            );
          } else {
            const stats = await TaskPomodoroStatsService.getTaskStats(
              session.task_id, 
              this.currentUser.id
            );
            cumulativePomodoroNumber = stats.totalWorkSessions;
            cumulativeBreakNumber = stats.totalBreakSessions + 1;
          }
        }
        
        await this.saveSessionOnce({
          user_id: this.currentUser.id,
          task_id: session.task_id,
          session_id: session.session_id,
          duration_minutes: elapsedTime,
          session_type: session.current_session_type as any,
          session_status: 'completed',
          interrupted: true,
          completed_at: new Date().toISOString(),
          pomodoro_number: cumulativePomodoroNumber,
          break_number: cumulativeBreakNumber,
        }, 'saveInterruptedSessionForSession');
      }
    } catch (error) {
      console.error('Error saving interrupted session:', error);
    }
  }

  async startWork() {
    if (!this.activeSession) return;

    try {
      // Handle restarting a stopped session
      const isRestartingStoppedSession = this.activeSession.session_status === 'active-stopped';
      const duration = isRestartingStoppedSession && this.activeSession.current_session_type === 'work' 
        ? this.activeSession.current_time_remaining || this.settings.workDuration * 60
        : this.settings.workDuration * 60;

      const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(this.activeSession.id, {
        current_session_type: 'work',
        session_status: 'active-running',
        current_start_time: new Date().toISOString(),
        current_pause_time: null,
        current_time_remaining: duration,
      });

      this.activeSession = updatedSession;
      this.timeRemaining = duration;
      this.isRunning = true;

      // Update global state
      this.globalState.updateSession(updatedSession, true);
      
      this.updateTimer();
      this.notifyListeners();
      
      const message = isRestartingStoppedSession ? 'Work session restarted' : 'Work session started';
      toast.info(message);
    } catch (error) {
      console.error('Error starting work session:', error);
      toast.error('Error starting work session');
    }
  }

  async startBreak(breakType: 'short_break' | 'long_break') {
    if (!this.activeSession) return;

    try {
      // Handle restarting a stopped session
      const isRestartingStoppedSession = this.activeSession.session_status === 'active-stopped';
      const baseDuration = breakType === 'short_break' 
        ? this.settings.shortBreakDuration * 60 
        : this.settings.longBreakDuration * 60;
      
      const duration = isRestartingStoppedSession && this.activeSession.current_session_type === breakType
        ? this.activeSession.current_time_remaining || baseDuration
        : baseDuration;

      const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(this.activeSession.id, {
        current_session_type: breakType,
        session_status: 'active-running',
        current_start_time: new Date().toISOString(),
        current_pause_time: null,
        current_time_remaining: duration,
      });

      this.activeSession = updatedSession;
      this.timeRemaining = duration;
      this.isRunning = true;

      // Update global state
      this.globalState.updateSession(updatedSession, true);
      
      this.updateTimer();
      this.notifyListeners();
      
      const breakTypeText = breakType === 'short_break' ? 'Short break' : 'Long break';
      const message = isRestartingStoppedSession ? `${breakTypeText} restarted` : `${breakTypeText} started`;
      toast.info(message);
    } catch (error) {
      console.error('Error starting break:', error);
      toast.error('Error starting break');
    }
  }

  async togglePause() {
    if (!this.activeSession) return;

    try {
      const newStatus = this.isRunning ? 'active-paused' : 'active-running';
      const now = new Date().toISOString();
      
      const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(this.activeSession.id, {
        session_status: newStatus,
        current_start_time: !this.isRunning ? now : this.activeSession.current_start_time,
        current_pause_time: this.isRunning ? now : null,
        current_time_remaining: this.isRunning ? this.timeRemaining : this.activeSession.current_time_remaining, // Preserve saved time when resuming
      });

      this.globalState.updateSession(updatedSession, true);
    } catch (error) {
      console.error('Error toggling pause:', error);
    }
  }

  async resumeWork() {
    if (!this.activeSession) return;

    try {
      const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(this.activeSession.id, {
        session_status: 'active-running',
        current_start_time: new Date().toISOString(),
        current_pause_time: null,
        // Keep existing saved time - will be restored by syncWithGlobalSession
      });

      this.globalState.updateSession(updatedSession, true);
    } catch (error) {
      console.error('Error resuming work:', error);
    }
  }

  async stopSession() {
    if (!this.activeSession) return;

    try {
      // 1. Stop timer immediately
      this.isRunning = false;
      this.clearTimer();

      // 2. Save interrupted session if there's elapsed time
      await this.saveInterruptedSession();

      // 3. Reset time to beginning and update database to stopped state
      const fullDuration = this.getCurrentSessionDuration() * 60;
      const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(this.activeSession.id, {
        session_status: 'active-stopped',
        current_start_time: null,
        current_pause_time: null,
        current_time_remaining: fullDuration
      });

      // 4. Update local state
      this.timeRemaining = fullDuration;
      this.activeSession = updatedSession;

      // 5. Update global state for cross-tab consistency
      this.globalState.updateSession(updatedSession, true);

      // 6. Notify listeners and provide feedback
      this.notifyListeners();
      toast.info('Timer stopped and reset');

    } catch (error) {
      console.error('Error stopping session:', error);
      toast.error('Error stopping timer');
    }
  }

  async skipSession() {
    if (!this.activeSession) return;
    
    try {
      const isWorkSession = this.activeSession.current_session_type === 'work';
      
      // Save skipped session to history
      await this.saveSkippedSession();
      
      if (isWorkSession) {
        // Do NOT increment completed_work_sessions for skipped sessions
        // Use current completed work count for break type determination
        const currentWorkCount = this.activeSession.completed_work_sessions;
        
        // Determine break type based on actual completed sessions (not incremented)
        const nextBreakType = this.determineNextBreakType(currentWorkCount, this.activeSession.sessions_until_long_break);
        
        await this.startBreak(nextBreakType);
        
        const breakTypeText = nextBreakType === 'long_break' ? 'long break' : 'short break';
        toast.info(`Skipped to ${breakTypeText} (${currentWorkCount}/${this.activeSession.sessions_until_long_break} work sessions)`);
      } else {
        // For break sessions, also don't increment break counter
        // Just transition to work session
        await this.startWork();
        toast.info('Skipped to work session');
      }
    } catch (error) {
      console.error('Error skipping session:', error);
      toast.error('Error skipping session');
    }
  }

  // Reusable method for consistent break type determination
  private determineNextBreakType(completedWorkSessions: number, sessionsUntilLongBreak: number): 'short_break' | 'long_break' {
    return completedWorkSessions % sessionsUntilLongBreak === 0 ? 'long_break' : 'short_break';
  }

  // Save skipped session to history
  private async saveSkippedSession() {
    if (!this.activeSession || !this.currentUser) return;

    try {
      // Calculate elapsed time using existing pattern
      if (this.activeSession.current_start_time) {
        const elapsed = Math.floor((Date.now() - new Date(this.activeSession.current_start_time).getTime()) / 1000 / 60);
        
        if (elapsed > 0) {
          const isWorkSession = this.activeSession.current_session_type === 'work';
          
          // Calculate proper cumulative pomodoro and break numbers for interrupted sessions
          let cumulativePomodoroNumber = 1;
          let cumulativeBreakNumber = 0;
          
          if (this.activeSession.task_id) {
            // Import TaskPomodoroStatsService to get cumulative counts
            const { TaskPomodoroStatsService } = await import('@/services/TaskPomodoroStatsService');
            
            if (isWorkSession) {
              // Get next cumulative pomodoro number for this task
              cumulativePomodoroNumber = await TaskPomodoroStatsService.getNextPomodoroNumber(
                this.activeSession.task_id, 
                this.currentUser.id
              );
            } else {
              // For breaks, get current cumulative work session count
              const stats = await TaskPomodoroStatsService.getTaskStats(
                this.activeSession.task_id, 
                this.currentUser.id
              );
              cumulativePomodoroNumber = stats.totalWorkSessions;
              cumulativeBreakNumber = stats.totalBreakSessions + 1;
            }
          } else {
            // For non-task sessions, use session-level counters
            cumulativePomodoroNumber = isWorkSession ? this.activeSession.completed_work_sessions + 1 : this.activeSession.completed_work_sessions;
            cumulativeBreakNumber = isWorkSession ? this.activeSession.completed_break_sessions : this.activeSession.completed_break_sessions + 1;
          }
          
          await this.saveSessionOnce({
            user_id: this.currentUser.id,
            task_id: this.activeSession.task_id,
            session_id: this.activeSession.session_id,
            duration_minutes: elapsed,
            session_type: this.activeSession.current_session_type as any,
            interrupted: true,
            pomodoro_number: cumulativePomodoroNumber,
            break_number: cumulativeBreakNumber,
          }, 'skipSession');
        }
      }
    } catch (error) {
      console.error('Error saving skipped session:', error);
    }
  }

  // Save interrupted session to history (for stop functionality)
  private async saveInterruptedSession() {
    if (!this.activeSession || !this.currentUser || !this.activeSession.current_start_time) return;

    try {
      const elapsed = Math.floor((Date.now() - new Date(this.activeSession.current_start_time).getTime()) / 1000 / 60);
      
      if (elapsed > 0) {
        const isWorkSession = this.activeSession.current_session_type === 'work';
        
        // Calculate proper cumulative pomodoro and break numbers for interrupted sessions
        let cumulativePomodoroNumber = 1;
        let cumulativeBreakNumber = 0;
        
        if (this.activeSession.task_id) {
          // Import TaskPomodoroStatsService to get cumulative counts
          const { TaskPomodoroStatsService } = await import('@/services/TaskPomodoroStatsService');
          
          if (isWorkSession) {
            // Get next cumulative pomodoro number for this task
            cumulativePomodoroNumber = await TaskPomodoroStatsService.getNextPomodoroNumber(
              this.activeSession.task_id, 
              this.currentUser.id
            );
          } else {
            // For breaks, get current cumulative work session count
            const stats = await TaskPomodoroStatsService.getTaskStats(
              this.activeSession.task_id, 
              this.currentUser.id
            );
            cumulativePomodoroNumber = stats.totalWorkSessions;
            cumulativeBreakNumber = stats.totalBreakSessions + 1;
          }
        } else {
          // For non-task sessions, use session-level counters
          cumulativePomodoroNumber = isWorkSession ? this.activeSession.completed_work_sessions + 1 : this.activeSession.completed_work_sessions;
          cumulativeBreakNumber = isWorkSession ? this.activeSession.completed_break_sessions : this.activeSession.completed_break_sessions + 1;
        }
        
        await this.saveSessionOnce({
          user_id: this.currentUser.id,
          task_id: this.activeSession.task_id,
          session_id: this.activeSession.session_id,
          duration_minutes: elapsed,
          session_type: this.activeSession.current_session_type as any,
          interrupted: true,
          pomodoro_number: cumulativePomodoroNumber,
          break_number: cumulativeBreakNumber,
        }, 'saveInterruptedSession');
      }
    } catch (error) {
      console.error('Error saving interrupted session:', error);
    }
  }

  async terminateSession() {
    if (!this.activeSession) return;

    this.globalState.setTerminating(true);
    const sessionId = this.activeSession.id;
    
    this.clearTimer();
    this.globalState.terminateCurrentSession();

    try {
      await SupabaseActivePomodoroService.terminateSession(sessionId);
      toast.info('Session terminated');
    } catch (error) {
      console.error('Error terminating session:', error);
      toast.error('Error terminating session');
    } finally {
      this.globalState.setTerminating(false);
    }
  }

  async resumeSession(sessionId: string) {
    try {
      // First get the current session to preserve saved time
      const currentSessions = await SupabaseActivePomodoroService.getActiveSessionsByUser(this.currentUser!.id);
      const currentSession = currentSessions.find(s => s.id === sessionId);
      
      console.log('Resuming session with saved time:', currentSession?.current_time_remaining);
      
      const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(sessionId, {
        session_status: 'active-running',
        current_start_time: new Date().toISOString(),
        current_pause_time: null,
        // Preserve the saved time - don't clear it
        current_time_remaining: currentSession?.current_time_remaining || null,
      });

      console.log('Updated session after resume:', updatedSession.current_time_remaining);
      this.globalState.updateSession(updatedSession, true);
      toast.success('Session resumed');
    } catch (error) {
      console.error('Error resuming session:', error);
      toast.error('Error resuming session');
    }
  }

  async updateSessionSettings(newSettings: PomodoroSessionSettings) {
    const oldSettings = { ...this.settings };
    this.settings = newSettings;
    this.saveSettings();
    
    // Update activeSession database record with new durations
    if (this.activeSession) {
      try {
        await SupabaseActivePomodoroService.updateSettings(this.activeSession.id, {
          work_duration: newSettings.workDuration,
          short_break_duration: newSettings.shortBreakDuration,
          long_break_duration: newSettings.longBreakDuration,
          sessions_until_long_break: newSettings.sessionsUntilLongBreak,
        });

        // Update local session object to reflect new durations
        this.activeSession = {
          ...this.activeSession,
          work_duration: newSettings.workDuration,
          short_break_duration: newSettings.shortBreakDuration,
          long_break_duration: newSettings.longBreakDuration,
          sessions_until_long_break: newSettings.sessionsUntilLongBreak,
        };
      } catch (error) {
        console.error('Error updating session settings in database:', error);
      }
    }
    
    // Calculate absolute difference time adjustment for active/paused sessions
    if (this.activeSession && (this.activeSession.session_status === 'active-running' || this.activeSession.session_status === 'active-paused')) {
      const oldDuration = this.getOldSessionDuration(this.activeSession.current_session_type, oldSettings);
      const newDuration = this.getCurrentSessionDuration();
      
      if (oldDuration !== newDuration) {
        // Calculate absolute difference in seconds
        const durationDifferenceSeconds = (newDuration - oldDuration) * 60;
        
        // Apply absolute adjustment: newTimeRemaining = currentTimeRemaining + difference
        const newTimeRemaining = this.timeRemaining + durationDifferenceSeconds;
        
        // Handle edge cases - adjust time but don't trigger completion
        if (newTimeRemaining <= 0) {
          // Set minimum time remaining instead of completing
          this.timeRemaining = 1; // 1 second remaining
          console.log('⚠️ Settings adjustment resulted in near-zero time, setting to 1 second');
          return;
        }
        
        // Cap to new total duration if needed
        const newTotalSeconds = newDuration * 60;
        this.timeRemaining = Math.min(newTimeRemaining, newTotalSeconds);
        
        // Persist adjusted time to database for paused sessions
        if (this.activeSession.session_status === 'active-paused') {
          try {
            const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(this.activeSession.id, {
              current_time_remaining: this.timeRemaining
            });
            
            // Update global state for real-time sync across tabs
            this.globalState.updateSession(updatedSession, true);
          } catch (error) {
            console.error('Error persisting adjusted time for paused session:', error);
          }
        }
      }
    }
    
    // Update time remaining if session is stopped
    if (this.activeSession && this.activeSession.session_status === 'active-stopped') {
      const newDuration = this.getCurrentSessionDuration();
      this.timeRemaining = newDuration * 60;
    }
  }

  async terminateSessionById(sessionId: string) {
    try {
      await SupabaseActivePomodoroService.terminateSession(sessionId);
      
      // If it's the current active session, clear it from global state
      if (this.activeSession?.id === sessionId) {
        this.globalState.updateSession(null, true);
      }
      
      toast.success('Timer dismissed');
    } catch (error) {
      console.error('Error terminating session:', error);
      toast.error('Failed to dismiss timer');
    }
  }

  private formatSessionAge(ageHours: number): string {
    if (ageHours < 1) {
      const minutes = Math.floor(ageHours * 60);
      return minutes <= 1 ? '1 minute' : `${minutes} minutes`;
    } else if (ageHours < 24) {
      const hours = Math.floor(ageHours);
      return hours === 1 ? '1 hour' : `${hours} hours`;
    } else {
      const days = Math.floor(ageHours / 24);
      return days === 1 ? '1 day' : `${days} days`;
    }
  }

  private getOldSessionDuration(sessionType: string, oldSettings: PomodoroSessionSettings): number {
    switch (sessionType) {
      case 'work': return oldSettings.workDuration;
      case 'short_break': return oldSettings.shortBreakDuration;
      case 'long_break': return oldSettings.longBreakDuration;
      default: return 0;
    }
  }

  // Helper method to prevent duplicate session saves
  private async saveSessionOnce(sessionData: any, saveContext: string): Promise<void> {
    const sessionKey = `${sessionData.session_id}-${sessionData.session_type}-${sessionData.interrupted ? 'interrupted' : 'completed'}`;
    
    if (this.savedSessions.has(sessionKey)) {
      console.log('🚫 Session already saved:', { sessionKey, context: saveContext });
      return;
    }

    console.log('💾 Saving session:', { sessionKey, context: saveContext });
    this.savedSessions.add(sessionKey);
    
    try {
      await SupabasePomodoroService.saveSession(sessionData);
      console.log('✅ Session saved successfully:', { sessionKey, context: saveContext });
    } catch (error) {
      // Remove from saved set if save failed so it can be retried
      this.savedSessions.delete(sessionKey);
      console.error('❌ Failed to save session:', { sessionKey, context: saveContext, error });
      throw error;
    }
  }
}