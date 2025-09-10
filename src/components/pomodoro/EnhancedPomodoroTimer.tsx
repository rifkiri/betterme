import React, { useState, useEffect } from 'react';
import { usePomodoroSessionManager } from '@/hooks/usePomodoroSessionManager';
import { SupabaseActivePomodoroService } from '@/services/SupabaseActivePomodoroService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Task } from '@/types/productivity';
import { PomodoroCardTimer } from './PomodoroCardTimer';

interface EnhancedPomodoroTimerProps {
  task?: Task;
  className?: string;
  onMinimize?: () => void;
  onClose?: () => void;
}

export const EnhancedPomodoroTimer: React.FC<EnhancedPomodoroTimerProps> = ({
  task,
  className,
  onMinimize,
  onClose
}) => {
  const { currentUser } = useCurrentUser();
  const {
    activeSession,
    settings,
    isRunning,
    timeRemaining,
    createSession,
    terminateSession,
    startWork,
    togglePause,
    stopSession,
    skipSession,
    updateSessionSettings,
    minimizeCard,
  } = usePomodoroSessionManager();

  const [taskActiveSession, setTaskActiveSession] = useState(null);
  const [isSessionVisible, setIsSessionVisible] = useState(false);

  // Check if there's an active session for this specific task
  useEffect(() => {
    if (!task?.id || !currentUser?.id) return;

    const checkTaskSession = async () => {
      try {
        const session = await SupabaseActivePomodoroService.getActiveSessionByTask(task.id, currentUser.id);
        setTaskActiveSession(session);
        setIsSessionVisible(!!session);
      } catch (error) {
        console.error('Error checking task session:', error);
      }
    };

    checkTaskSession();
  }, [task?.id, currentUser?.id, activeSession]);

  // Show session if there's an active session for this task or if we just created one
  const shouldShowSession = isSessionVisible || (activeSession?.task_id === task?.id);

  const handleTimerClick = async () => {
    if (!task) return;
    
    // If no session exists, create one
    if (!taskActiveSession && !activeSession) {
      const newSession = await createSession(task.id, task.title);
      if (newSession) {
        setTaskActiveSession(newSession);
        setIsSessionVisible(true);
      }
    }
  };

  const handleClose = async () => {
    if (taskActiveSession) {
      await terminateSession();
      setTaskActiveSession(null);
      setIsSessionVisible(false);
    }
    onClose?.();
  };

  const handleMinimize = async () => {
    if (taskActiveSession) {
      await minimizeCard();
      setIsSessionVisible(false);
    }
    onMinimize?.();
  };

  if (!task) return null;

  return (
    <div className={className}>
      {shouldShowSession && (activeSession?.task_id === task.id || taskActiveSession) ? (
        <PomodoroCardTimer
          session={activeSession || taskActiveSession}
          settings={settings}
          isRunning={isRunning}
          timeRemaining={timeRemaining}
          onStart={startWork}
          onPause={togglePause}
          onStop={stopSession}
          onSkip={skipSession}
          onUpdateSettings={updateSessionSettings}
          onMinimize={handleMinimize}
          onClose={handleClose}
        />
      ) : (
        <button
          onClick={handleTimerClick}
          className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Start Pomodoro
        </button>
      )}
    </div>
  );
};