import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PomodoroSessionManager, PomodoroSessionSettings } from '@/services/PomodoroSessionManager';

export type { PomodoroSessionSettings };

export const usePomodoroSessionManager = () => {
  const { currentUser } = useCurrentUser();
  const [, setUpdateCounter] = useState(0);
  
  const sessionManager = PomodoroSessionManager.getInstance();

  // Initialize session manager for current user
  useEffect(() => {
    if (currentUser?.id) {
      sessionManager.initializeForUser(currentUser.id);
    }
  }, [currentUser?.id, sessionManager]);

  // Subscribe to session manager updates
  useEffect(() => {
    const unsubscribe = sessionManager.subscribe(() => {
      setUpdateCounter(prev => prev + 1); // Force re-render
    });

    return unsubscribe;
  }, [sessionManager]);

  // Get current state from session manager
  const state = sessionManager.getState();
  
  return {
    activeSession: state.activeSession,
    settings: state.settings,
    isRunning: state.isRunning,
    timeRemaining: state.timeRemaining,
    createSession: (taskId?: string, taskTitle?: string) => sessionManager.createSession(taskId, taskTitle),
    startWork: () => sessionManager.startWork(),
    startBreak: (breakType: 'short_break' | 'long_break') => sessionManager.startBreak(breakType),
    togglePause: () => sessionManager.togglePause(),
    resumeWork: () => sessionManager.resumeWork(),
    stopSession: () => sessionManager.stopSession(),
    skipSession: () => sessionManager.skipSession(),
    terminateSession: () => sessionManager.terminateSession(),
    terminateSessionById: (sessionId: string) => sessionManager.terminateSessionById(sessionId),
    resumeSession: (sessionId: string) => sessionManager.resumeSession(sessionId),
    updateSessionSettings: (settings: PomodoroSessionSettings) => sessionManager.updateSessionSettings(settings),
  };
};