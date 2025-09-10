import { toast } from 'sonner';
import { SupabaseActivePomodoroService, ActivePomodoroSession } from '@/services/SupabaseActivePomodoroService';
import { SupabasePomodoroService } from '@/services/SupabasePomodoroService';
import { PomodoroGlobalState } from '@/hooks/usePomodoroGlobalState';

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
      // Always restore saved time when resuming from paused state
      if (globalSession.session_status === 'active-paused' && 
          globalSession.current_time_remaining !== null && 
          globalSession.current_time_remaining !== undefined) {
        this.timeRemaining = globalSession.current_time_remaining;
      }
      // For running sessions, only update if it's a new session or we don't have a current session
      else if (!this.isRunning || !this.activeSession || globalSession.id !== this.activeSession.id) {
        if (globalSession.current_time_remaining !== null && globalSession.current_time_remaining !== undefined) {
          this.timeRemaining = globalSession.current_time_remaining;
        }
      }
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

      // Load active sessions from database
      const sessions = await SupabaseActivePomodoroService.getActiveSessionsByUser(userId);
      
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
          toast.info('You have a paused timer. Click to resume.', {
            action: {
              label: 'Resume',
              onClick: () => this.resumeSession(pausedSession.id),
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
        this.timeRemaining -= 1;
        if (this.timeRemaining <= 0) {
          this.handleSessionComplete();
        }
        this.notifyListeners();
      }, 1000);
    }
  }

  private async handleSessionComplete() {
    if (!this.activeSession || !this.currentUser) return;

    this.isRunning = false;
    this.clearTimer();
    this.playSound();

    try {
      // Save completed session to history
      await SupabasePomodoroService.saveSession({
        user_id: this.currentUser.id,
        task_id: this.activeSession.task_id,
        session_id: this.activeSession.session_id,
        duration_minutes: this.getCurrentSessionDuration(),
        session_type: this.activeSession.current_session_type as any,
        pomodoro_number: this.activeSession.completed_work_sessions + 1,
        break_number: this.activeSession.completed_break_sessions,
      });

      const isWorkSession = this.activeSession.current_session_type === 'work';
      
      if (isWorkSession) {
        this.showNotification('Work Session Complete!', `Great job! You've completed ${this.getCurrentSessionDuration()} minutes of focused work.`);
        
        const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(this.activeSession.id, {
          completed_work_sessions: this.activeSession.completed_work_sessions + 1,
        });
        this.activeSession = updatedSession;
        
        if (this.settings.autoStartBreaks) {
          const breakType = updatedSession.completed_work_sessions % updatedSession.sessions_until_long_break === 0 
            ? 'long_break' : 'short_break';
          this.startBreak(breakType);
        } else {
          await SupabaseActivePomodoroService.updateActiveSession(this.activeSession.id, {
            session_status: 'active-stopped',
            current_session_type: updatedSession.completed_work_sessions % updatedSession.sessions_until_long_break === 0 
              ? 'long_break' : 'short_break',
          });
        }
      } else {
        this.showNotification('Break Complete!', 'Break time is over. Ready to get back to work?');
        
        const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(this.activeSession.id, {
          completed_break_sessions: this.activeSession.completed_break_sessions + 1,
        });
        this.activeSession = updatedSession;
        
        if (this.settings.autoStartWork) {
          this.startWork();
        } else {
          await SupabaseActivePomodoroService.updateActiveSession(this.activeSession.id, {
            session_status: 'active-stopped',
            current_session_type: 'work',
          });
        }
      }
    } catch (error) {
      console.error('Error handling session completion:', error);
      toast.error('Error saving session completion');
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

  private notifyListeners() {
    this.listeners.forEach(callback => callback());
  }

  getState() {
    return {
      activeSession: this.activeSession,
      settings: this.settings,
      isRunning: this.isRunning,
      timeRemaining: this.timeRemaining,
    };
  }

  async createSession(taskId?: string, taskTitle?: string): Promise<ActivePomodoroSession | null> {
    if (!this.currentUser?.id) return null;

    try {
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

  async startWork() {
    if (!this.activeSession) return;

    try {
      const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(this.activeSession.id, {
        session_status: 'active-running',
        current_session_type: 'work',
        current_start_time: new Date().toISOString(),
        current_pause_time: null,
        current_time_remaining: null, // Clear saved time for fresh start
      });

      this.globalState.updateSession(updatedSession, true);
      this.timeRemaining = updatedSession.work_duration * 60;
    } catch (error) {
      console.error('Error starting work:', error);
    }
  }

  async startBreak(breakType: 'short_break' | 'long_break') {
    if (!this.activeSession) return;

    try {
      const duration = breakType === 'long_break' 
        ? this.activeSession.long_break_duration 
        : this.activeSession.short_break_duration;

      const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(this.activeSession.id, {
        session_status: 'active-running',
        current_session_type: breakType,
        current_start_time: new Date().toISOString(),
        current_pause_time: null,
        current_time_remaining: null, // Clear saved time for fresh start
      });

      this.globalState.updateSession(updatedSession, true);
      this.timeRemaining = duration * 60;
    } catch (error) {
      console.error('Error starting break:', error);
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
        current_time_remaining: this.isRunning ? this.timeRemaining : null, // Save time when pausing
      });

      this.globalState.updateSession(updatedSession, true);
    } catch (error) {
      console.error('Error toggling pause:', error);
    }
  }

  async stopSession() {
    if (!this.activeSession) return;

    try {
      // Save interrupted session if it was a work session and had elapsed time
      if (this.activeSession.current_session_type === 'work' && this.activeSession.current_start_time) {
        const elapsed = Math.floor((Date.now() - new Date(this.activeSession.current_start_time).getTime()) / 1000 / 60);
        if (elapsed > 0) {
          await SupabasePomodoroService.saveSession({
            user_id: this.currentUser!.id,
            task_id: this.activeSession.task_id,
            session_id: this.activeSession.session_id,
            duration_minutes: elapsed,
            session_type: 'work',
            interrupted: true,
            pomodoro_number: this.activeSession.completed_work_sessions + 1,
            break_number: this.activeSession.completed_break_sessions,
          });
        }
      }

      await SupabaseActivePomodoroService.updateActiveSession(this.activeSession.id, {
        session_status: 'active-stopped',
        current_start_time: null,
        current_pause_time: null,
      });

      const duration = this.getCurrentSessionDuration();
      this.timeRemaining = duration * 60;
      
      toast.info('Timer stopped');
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  }

  async skipSession() {
    if (!this.activeSession) return;
    
    try {
      const isWorkSession = this.activeSession.current_session_type === 'work';
      
      if (isWorkSession) {
        const nextBreakType = this.activeSession.completed_work_sessions % this.activeSession.sessions_until_long_break === 0 
          ? 'long_break' : 'short_break';
        await this.startBreak(nextBreakType);
      } else {
        await this.startWork();
      }
      
      toast.info(`Skipped to ${isWorkSession ? 'break' : 'work session'}`);
    } catch (error) {
      console.error('Error skipping session:', error);
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
      const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(sessionId, {
        session_status: 'active-running',
        current_start_time: new Date().toISOString(),
        current_pause_time: null,
      });

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
        
        // Handle edge cases
        if (newTimeRemaining <= 0) {
          this.handleSessionComplete();
          return;
        }
        
        // Cap to new total duration if needed
        const newTotalSeconds = newDuration * 60;
        this.timeRemaining = Math.min(newTimeRemaining, newTotalSeconds);
      }
    }
    
    // Update time remaining if session is stopped
    if (this.activeSession && this.activeSession.session_status === 'active-stopped') {
      const newDuration = this.getCurrentSessionDuration();
      this.timeRemaining = newDuration * 60;
    }
    
    this.notifyListeners();
    
    // Request notification permission if enabled
    if (newSettings.notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
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
}