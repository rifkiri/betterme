import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { SupabaseActivePomodoroService, ActivePomodoroSession } from '@/services/SupabaseActivePomodoroService';
import { SupabasePomodoroService } from '@/services/SupabasePomodoroService';
import { useCurrentUser } from '@/hooks/useCurrentUser';

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

export const usePomodoroSessionManager = () => {
  const { currentUser } = useCurrentUser();
  const [activeSession, setActiveSession] = useState<ActivePomodoroSession | null>(null);
  const [settings, setSettings] = useState<PomodoroSessionSettings>(DEFAULT_SETTINGS);
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
    }
  }, []);

  // Load active session on mount
  useEffect(() => {
    if (!currentUser?.id) return;

    const loadActiveSessions = async () => {
      try {
        const sessions = await SupabaseActivePomodoroService.getActiveSessionsByUser(currentUser.id);
        const runningSession = sessions.find(s => s.session_status === 'active-running');
        const pausedSession = sessions.find(s => s.session_status === 'active-paused');
        
        if (runningSession || pausedSession) {
          const session = runningSession || pausedSession;
          setActiveSession(session);
          
          if (session.current_time_remaining) {
            setTimeRemaining(session.current_time_remaining);
          }
          
          if (runningSession && session.current_start_time) {
            // Calculate actual remaining time based on elapsed time
            const elapsed = Math.floor((Date.now() - new Date(session.current_start_time).getTime()) / 1000);
            const remaining = Math.max(0, (session.current_time_remaining || 0) - elapsed);
            setTimeRemaining(remaining);
            setIsRunning(true);
          } else if (pausedSession) {
            // Show resume option for paused session
            toast.info('You have a paused timer. Click to resume.', {
              action: {
                label: 'Resume',
                onClick: () => resumeSession(session.id)
              },
              duration: 10000,
            });
          }
        }
      } catch (error) {
        console.error('Error loading active sessions:', error);
      }
    };

    loadActiveSessions();
  }, [currentUser?.id]);

  // Timer interval effect
  useEffect(() => {
    if (isRunning && activeSession && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, activeSession, timeRemaining]);

  // Update session in database when timer state changes
  useEffect(() => {
    if (!activeSession || !currentUser?.id) return;

    const updateSession = async () => {
      try {
        await SupabaseActivePomodoroService.updateActiveSession(activeSession.id, {
          session_status: isRunning ? 'active-running' : 'active-paused',
          current_time_remaining: timeRemaining,
          current_start_time: isRunning ? new Date().toISOString() : undefined,
          current_pause_time: !isRunning ? new Date().toISOString() : undefined,
        });
      } catch (error) {
        console.error('Error updating session:', error);
      }
    };

    const debounceTimer = setTimeout(updateSession, 1000);
    return () => clearTimeout(debounceTimer);
  }, [isRunning, timeRemaining, activeSession?.id]);

  // Audio and notifications
  const playSound = useCallback(() => {
    if (!settings.soundEnabled) return;

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAZA0GV2+/Zfy4NHHzN6d+BNAIWXrnn7qFAEx9g';
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {}); // Ignore errors
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [settings.soundEnabled]);

  const showNotification = useCallback((title: string, body: string) => {
    if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
    toast.success(title, { description: body });
  }, [settings.notificationsEnabled]);

  // Request notification permission
  useEffect(() => {
    if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [settings.notificationsEnabled]);

  const handleSessionComplete = useCallback(async () => {
    if (!activeSession) return;

    setIsRunning(false);
    playSound();

    try {
      // Save completed session to history
      await SupabasePomodoroService.saveSession({
        user_id: currentUser!.id,
        task_id: activeSession.task_id,
        session_id: activeSession.session_id,
        duration_minutes: getCurrentSessionDuration(),
        session_type: activeSession.current_session_type as any,
        pomodoro_number: activeSession.completed_work_sessions + 1,
        break_number: activeSession.completed_break_sessions,
      });

      const isWorkSession = activeSession.current_session_type === 'work';
      
      if (isWorkSession) {
        showNotification('Work Session Complete!', `Great job! You've completed ${getCurrentSessionDuration()} minutes of focused work.`);
        
        // Update completed work sessions count
        const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(activeSession.id, {
          completed_work_sessions: activeSession.completed_work_sessions + 1,
        });
        setActiveSession(updatedSession);
        
        // Start break if auto-start is enabled
        if (settings.autoStartBreaks) {
          const breakType = updatedSession.completed_work_sessions % updatedSession.sessions_until_long_break === 0 
            ? 'long_break' : 'short_break';
          startBreak(breakType);
        } else {
          // Stop timer and show start break option
          await SupabaseActivePomodoroService.updateActiveSession(activeSession.id, {
            session_status: 'active-stopped',
            current_session_type: updatedSession.completed_work_sessions % updatedSession.sessions_until_long_break === 0 
              ? 'long_break' : 'short_break',
          });
        }
      } else {
        showNotification('Break Complete!', 'Break time is over. Ready to get back to work?');
        
        // Update completed break sessions count
        const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(activeSession.id, {
          completed_break_sessions: activeSession.completed_break_sessions + 1,
        });
        setActiveSession(updatedSession);
        
        // Start work if auto-start is enabled
        if (settings.autoStartWork) {
          startWork();
        } else {
          // Stop timer and show start work option
          await SupabaseActivePomodoroService.updateActiveSession(activeSession.id, {
            session_status: 'active-stopped',
            current_session_type: 'work',
          });
        }
      }
    } catch (error) {
      console.error('Error handling session completion:', error);
      toast.error('Error saving session completion');
    }
  }, [activeSession, currentUser, playSound, showNotification, settings]);

  const getCurrentSessionDuration = useCallback(() => {
    if (!activeSession) return 0;
    switch (activeSession.current_session_type) {
      case 'work':
        return activeSession.work_duration;
      case 'short_break':
        return activeSession.short_break_duration;
      case 'long_break':
        return activeSession.long_break_duration;
      default:
        return 0;
    }
  }, [activeSession]);

  // Session control functions
  const createSession = useCallback(async (taskId?: string, taskTitle?: string) => {
    if (!currentUser?.id) return null;

    try {
      const newSession = await SupabaseActivePomodoroService.createActiveSession({
        user_id: currentUser.id,
        task_id: taskId,
        session_id: crypto.randomUUID(),
        task_title: taskTitle,
        session_status: 'active-stopped',
        current_session_type: 'work',
        work_duration: settings.workDuration,
        short_break_duration: settings.shortBreakDuration,
        long_break_duration: settings.longBreakDuration,
        sessions_until_long_break: settings.sessionsUntilLongBreak,
        completed_work_sessions: 0,
        completed_break_sessions: 0,
        is_card_visible: true,
        is_floating_visible: false,
      });

      setActiveSession(newSession);
      setTimeRemaining(newSession.work_duration * 60);
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Error creating Pomodoro session');
      return null;
    }
  }, [currentUser, settings]);

  const startWork = useCallback(async () => {
    if (!activeSession) return;

    try {
      const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(activeSession.id, {
        session_status: 'active-running',
        current_session_type: 'work',
        current_start_time: new Date().toISOString(),
        current_pause_time: null,
      });

      setActiveSession(updatedSession);
      setTimeRemaining(updatedSession.work_duration * 60);
      setIsRunning(true);
    } catch (error) {
      console.error('Error starting work:', error);
    }
  }, [activeSession]);

  const startBreak = useCallback(async (breakType: 'short_break' | 'long_break') => {
    if (!activeSession) return;

    try {
      const duration = breakType === 'long_break' 
        ? activeSession.long_break_duration 
        : activeSession.short_break_duration;

      const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(activeSession.id, {
        session_status: 'active-running',
        current_session_type: breakType,
        current_start_time: new Date().toISOString(),
        current_pause_time: null,
      });

      setActiveSession(updatedSession);
      setTimeRemaining(duration * 60);
      setIsRunning(true);
    } catch (error) {
      console.error('Error starting break:', error);
    }
  }, [activeSession]);

  const togglePause = useCallback(async () => {
    if (!activeSession) return;

    try {
      const newStatus = isRunning ? 'active-paused' : 'active-running';
      const now = new Date().toISOString();
      
      const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(activeSession.id, {
        session_status: newStatus,
        current_start_time: !isRunning ? now : activeSession.current_start_time,
        current_pause_time: isRunning ? now : null,
      });

      setActiveSession(updatedSession);
      setIsRunning(!isRunning);
    } catch (error) {
      console.error('Error toggling pause:', error);
    }
  }, [activeSession, isRunning]);

  const stopSession = useCallback(async () => {
    if (!activeSession) return;

    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      // Save interrupted session if it was a work session and had elapsed time
      if (activeSession.current_session_type === 'work' && activeSession.current_start_time) {
        const elapsed = Math.floor((Date.now() - new Date(activeSession.current_start_time).getTime()) / 1000 / 60);
        if (elapsed > 0) {
          await SupabasePomodoroService.saveSession({
            user_id: currentUser!.id,
            task_id: activeSession.task_id,
            session_id: activeSession.session_id,
            duration_minutes: elapsed,
            session_type: 'work',
            interrupted: true,
            pomodoro_number: activeSession.completed_work_sessions + 1,
            break_number: activeSession.completed_break_sessions,
          });
        }
      }

      // Update session to stopped state
      await SupabaseActivePomodoroService.updateActiveSession(activeSession.id, {
        session_status: 'active-stopped',
        current_start_time: null,
        current_pause_time: null,
      });

      // Reset time to session duration
      const duration = getCurrentSessionDuration();
      setTimeRemaining(duration * 60);
      
      toast.info('Timer stopped');
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  }, [activeSession, currentUser]);

  const terminateSession = useCallback(async () => {
    if (!activeSession) return;

    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      // Ensure visibility flags are reset before termination
      await SupabaseActivePomodoroService.updateActiveSession(activeSession.id, {
        is_card_visible: false,
        is_floating_visible: false,
      });
      
      await SupabaseActivePomodoroService.terminateSession(activeSession.id);
      setActiveSession(null);
      setTimeRemaining(0);
      toast.info('Session closed');
    } catch (error) {
      console.error('Error terminating session:', error);
    }
  }, [activeSession]);

  const resumeSession = useCallback(async (sessionId: string) => {
    if (!activeSession || activeSession.id !== sessionId) return;

    try {
      const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(sessionId, {
        session_status: 'active-running',
        current_start_time: new Date().toISOString(),
        current_pause_time: null,
      });

      setActiveSession(updatedSession);
      setIsRunning(true);
    } catch (error) {
      console.error('Error resuming session:', error);
    }
  }, [activeSession]);

  const updateSessionSettings = useCallback(async (newSettings: PomodoroSessionSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));

    if (!activeSession) return;

    try {
      // Update session settings in database
      await SupabaseActivePomodoroService.updateSettings(activeSession.id, {
        work_duration: newSettings.workDuration,
        short_break_duration: newSettings.shortBreakDuration,
        long_break_duration: newSettings.longBreakDuration,
        sessions_until_long_break: newSettings.sessionsUntilLongBreak,
      });

      // If currently stopped, update time remaining to reflect new duration
      if (activeSession.session_status === 'active-stopped') {
        const newDuration = activeSession.current_session_type === 'work' 
          ? newSettings.workDuration
          : activeSession.current_session_type === 'long_break'
          ? newSettings.longBreakDuration
          : newSettings.shortBreakDuration;
        
        setTimeRemaining(newDuration * 60);
      } else if (activeSession.session_status === 'active-running') {
        // If running, adjust remaining time proportionally
        const currentDuration = getCurrentSessionDuration();
        const newDuration = activeSession.current_session_type === 'work' 
          ? newSettings.workDuration
          : activeSession.current_session_type === 'long_break'
          ? newSettings.longBreakDuration
          : newSettings.shortBreakDuration;
        
        if (currentDuration > 0) {
          const progressRatio = (currentDuration * 60 - timeRemaining) / (currentDuration * 60);
          const newTimeRemaining = Math.max(0, newDuration * 60 - (progressRatio * newDuration * 60));
          setTimeRemaining(Math.floor(newTimeRemaining));
        }
      }
    } catch (error) {
      console.error('Error updating session settings:', error);
    }
  }, [activeSession, settings, timeRemaining, getCurrentSessionDuration]);

  const skipSession = useCallback(async () => {
    if (!activeSession) return;

    const isWork = activeSession.current_session_type === 'work';
    
    if (isWork) {
      const nextBreakType = (activeSession.completed_work_sessions + 1) % activeSession.sessions_until_long_break === 0
        ? 'long_break' : 'short_break';
      
      // Update completed work sessions and start break
      const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(activeSession.id, {
        completed_work_sessions: activeSession.completed_work_sessions + 1,
      });
      setActiveSession(updatedSession);
      startBreak(nextBreakType);
    } else {
      // Update completed break sessions and start work
      const updatedSession = await SupabaseActivePomodoroService.updateActiveSession(activeSession.id, {
        completed_break_sessions: activeSession.completed_break_sessions + 1,
      });
      setActiveSession(updatedSession);
      startWork();
    }
  }, [activeSession, startBreak, startWork]);

  const minimizeCard = useCallback(async () => {
    if (!activeSession) return;

    try {
      await SupabaseActivePomodoroService.updateActiveSession(activeSession.id, {
        is_card_visible: false,
        is_floating_visible: true,
      });
    } catch (error) {
      console.error('Error minimizing card:', error);
    }
  }, [activeSession]);

  const showCard = useCallback(async () => {
    if (!activeSession) return;

    try {
      await SupabaseActivePomodoroService.updateActiveSession(activeSession.id, {
        is_card_visible: true,
        is_floating_visible: false,
      });
    } catch (error) {
      console.error('Error showing card:', error);
    }
  }, [activeSession]);

  return {
    // State
    activeSession,
    settings,
    isRunning,
    timeRemaining,
    
    // Session management
    createSession,
    terminateSession,
    
    // Timer controls
    startWork,
    startBreak,
    togglePause,
    stopSession,
    skipSession,
    
    // Settings
    updateSessionSettings,
    
    // UI controls
    minimizeCard,
    showCard,
  };
};