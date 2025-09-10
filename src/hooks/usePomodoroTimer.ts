import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { usePomodoroCompletion } from './usePomodoroCompletion';

export interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
}

export interface PomodoroSession {
  taskId: string;
  taskTitle: string;
  startTime: number;
  duration: number;
  sessionType: 'work' | 'short_break' | 'long_break';
  isPaused: boolean;
  pausedTime?: number;
  completedPomodoros: number;
  timeRemaining: number;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  soundEnabled: true,
  notificationsEnabled: true,
  autoStartBreaks: false,
  autoStartWork: false,
};

const STORAGE_KEY = 'pomodoro_session';
const SETTINGS_KEY = 'pomodoro_settings';

export const usePomodoroTimer = () => {
  const [session, setSession] = useState<PomodoroSession | null>(() => {
    // Synchronously load session from localStorage on initial render
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedSession = JSON.parse(saved) as PomodoroSession;
        // Calculate time remaining based on pause state
        if (parsedSession.isPaused && parsedSession.pausedTime) {
          const elapsedWhilePaused = Date.now() - parsedSession.pausedTime;
          parsedSession.startTime += elapsedWhilePaused;
        }
        return parsedSession;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    // Synchronously load settings from localStorage on initial render
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { saveCompletedSession } = usePomodoroCompletion();

  // Initialize session state and handle timer resumption
  useEffect(() => {
    if (session && !session.isPaused) {
      setIsRunning(true);
    }
  }, []);

  // Save session to localStorage
  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  // Save settings to localStorage
  const updateSettings = useCallback((newSettings: PomodoroSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  }, []);

  // Request notification permission
  useEffect(() => {
    if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [settings.notificationsEnabled]);

  // Play sound
  const playSound = useCallback(() => {
    if (settings.soundEnabled) {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  }, [settings.soundEnabled]);

  // Show notification
  const showNotification = useCallback((title: string, body: string) => {
    if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
    toast.success(title);
  }, [settings.notificationsEnabled]);

  // Handle session completion
  const handleSessionComplete = useCallback(async () => {
    if (!session) return;

    // Save completed session to database
    await saveCompletedSession(
      session.taskId,
      session.duration,
      session.sessionType,
      false
    );

    playSound();
    
    if (session.sessionType === 'work') {
      const newPomodoros = session.completedPomodoros + 1;
      const isLongBreakTime = newPomodoros % settings.sessionsUntilLongBreak === 0;
      
      showNotification(
        'Pomodoro Complete!',
        `Great work! Time for a ${isLongBreakTime ? 'long' : 'short'} break.`
      );

      if (settings.autoStartBreaks) {
        startBreak(isLongBreakTime ? 'long_break' : 'short_break');
      } else {
        setSession(null);
        setIsRunning(false);
      }
    } else {
      showNotification('Break Complete!', 'Ready to get back to work?');
      
      if (settings.autoStartWork && session.taskId) {
        startWork(session.taskId, session.taskTitle);
      } else {
        setSession(null);
        setIsRunning(false);
      }
    }
  }, [session, settings, playSound, showNotification, saveCompletedSession]);

  // Timer tick
  useEffect(() => {
    if (isRunning && session && !session.isPaused) {
      intervalRef.current = setInterval(() => {
        setSession(prev => {
          if (!prev) return null;
          
          const elapsed = Math.floor((Date.now() - prev.startTime) / 1000);
          const totalSeconds = prev.duration * 60;
          const remaining = Math.max(0, totalSeconds - elapsed);
          
          if (remaining === 0) {
            handleSessionComplete();
            return null;
          }
          
          return { ...prev, timeRemaining: remaining };
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
      }
    };
  }, [isRunning, session, handleSessionComplete]);

  // Start work session
  const startWork = useCallback((taskId: string, taskTitle: string) => {
    const newSession: PomodoroSession = {
      taskId,
      taskTitle,
      startTime: Date.now(),
      duration: settings.workDuration,
      sessionType: 'work',
      isPaused: false,
      completedPomodoros: session?.completedPomodoros || 0,
      timeRemaining: settings.workDuration * 60,
    };
    setSession(newSession);
    setIsRunning(true);
    toast.success('Pomodoro started!');
  }, [settings.workDuration, session]);

  // Start break session
  const startBreak = useCallback((type: 'short_break' | 'long_break') => {
    const duration = type === 'short_break' ? settings.shortBreakDuration : settings.longBreakDuration;
    const newSession: PomodoroSession = {
      taskId: session?.taskId || '',
      taskTitle: session?.taskTitle || '',
      startTime: Date.now(),
      duration,
      sessionType: type,
      isPaused: false,
      completedPomodoros: session?.completedPomodoros || 0,
      timeRemaining: duration * 60,
    };
    setSession(newSession);
    setIsRunning(true);
    toast.success(`${type === 'short_break' ? 'Short' : 'Long'} break started!`);
  }, [settings, session]);

  // Pause/Resume
  const togglePause = useCallback(() => {
    if (!session) return;

    if (session.isPaused) {
      // Resume
      const pauseDuration = Date.now() - (session.pausedTime || 0);
      setSession({
        ...session,
        isPaused: false,
        startTime: session.startTime + pauseDuration,
        pausedTime: undefined,
      });
      setIsRunning(true);
      toast.success('Timer resumed');
    } else {
      // Pause
      setSession({
        ...session,
        isPaused: true,
        pausedTime: Date.now(),
      });
      setIsRunning(false);
      toast.info('Timer paused');
    }
  }, [session]);

  // Stop session
  const stopSession = useCallback(async () => {
    // Save interrupted session if it was a work session
    if (session && session.sessionType === 'work') {
      const elapsed = Math.floor((Date.now() - session.startTime) / 1000 / 60);
      if (elapsed > 0) {
        await saveCompletedSession(
          session.taskId,
          elapsed,
          session.sessionType,
          true
        );
      }
    }
    setSession(null);
    setIsRunning(false);
    localStorage.removeItem(STORAGE_KEY);
    toast.info('Timer stopped');
  }, [session, saveCompletedSession]);

  // Skip to next session
  const skipSession = useCallback(() => {
    if (!session) return;
    
    if (session.sessionType === 'work') {
      const newPomodoros = session.completedPomodoros;
      const isLongBreakTime = (newPomodoros + 1) % settings.sessionsUntilLongBreak === 0;
      startBreak(isLongBreakTime ? 'long_break' : 'short_break');
    } else {
      if (session.taskId) {
        startWork(session.taskId, session.taskTitle);
      } else {
        stopSession();
      }
    }
  }, [session, settings, startBreak, startWork, stopSession]);

  return {
    session,
    settings,
    isRunning,
    startWork,
    startBreak,
    togglePause,
    stopSession,
    skipSession,
    updateSettings,
  };
};