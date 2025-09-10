import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePomodoroSessionManager } from '@/hooks/usePomodoroSessionManager';
import { useRouteContext } from '@/hooks/useRouteContext';
import { PomodoroCardTimer } from './PomodoroCardTimer';
import { IconButton } from '@/components/ui/icon-button';
import { Clock, Maximize2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SmartFloatingTimer: React.FC = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const { isOnTasksPage, isTaskSectionVisible, hasNavigatedAway } = useRouteContext();
  
  const {
    activeSession,
    settings,
    isRunning,
    timeRemaining,
    startWork,
    togglePause,
    stopSession,
    skipSession,
    updateSessionSettings,
    terminateSession,
    showCard,
  } = usePomodoroSessionManager();

  // Show floating timer when:
  // 1. There's an active session, AND
  // 2. The in-card timer is not showing (either card not visible or user not on task page)
  const shouldShowFloating = activeSession && (
    !activeSession.is_card_visible ||
    hasNavigatedAway || 
    (isOnTasksPage && !isTaskSectionVisible)
  );

  if (!shouldShowFloating) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionTypeColor = () => {
    if (activeSession.session_status === 'active-paused') {
      return 'bg-content-warning border-content-warning-border text-content-warning-foreground';
    }
    if (activeSession.current_session_type === 'work') {
      return 'bg-primary text-primary-foreground border-primary';
    }
    return 'bg-content-success border-content-success-border text-content-success-foreground';
  };

  const handleGoToTasks = async () => {
    if (!isOnTasksPage) {
      navigate('/');
    }
    
    // Show card timer and hide floating timer
    await showCard();
    setIsExpanded(false);
    
    // Scroll to tasks section after navigation
    setTimeout(() => {
      const taskSection = document.querySelector('[data-testid="tasks-section"], .tasks-section, #tasks-section');
      if (taskSection) {
        taskSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleClose = async () => {
    await terminateSession();
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] transition-all duration-200">
      {isExpanded ? (
        <div className="bg-background border rounded-lg shadow-xl p-4 w-96 max-w-[calc(100vw-2rem)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Pomodoro Timer</h3>
            <div className="flex items-center gap-2">
              <IconButton
                icon={<ExternalLink className="h-4 w-4" />}
                onClick={handleGoToTasks}
                tooltip="Go to Tasks"
                variant="ghost"
              />
              <IconButton
                icon={<Maximize2 className="h-4 w-4 rotate-180" />}
                onClick={() => setIsExpanded(false)}
                tooltip="Minimize"
                variant="ghost"
              />
            </div>
          </div>
          
          <PomodoroCardTimer
            session={activeSession}
            settings={settings}
            isRunning={isRunning}
            timeRemaining={timeRemaining}
            onStart={startWork}
            onPause={togglePause}
            onStop={stopSession}
            onSkip={skipSession}
            onUpdateSettings={updateSessionSettings}
            onMinimize={() => setIsExpanded(false)}
            onClose={handleClose}
          />
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl",
            getSessionTypeColor()
          )}
        >
          <Clock className="h-5 w-5" />
          <div className="text-right">
            <div className="font-bold text-lg leading-tight">
              {formatTime(timeRemaining)}
            </div>
            {activeSession.session_status === 'active-paused' && (
              <div className="text-xs opacity-90">Paused</div>
            )}
          </div>
        </button>
      )}
    </div>
  );
};