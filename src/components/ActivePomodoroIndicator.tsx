import React, { useState } from 'react';
import { usePomodoroTimer } from '@/hooks/usePomodoroTimer';
import { PomodoroDisplay } from '@/components/pomodoro/PomodoroDisplay';
import { PomodoroControls } from '@/components/pomodoro/PomodoroControls';
import { PomodoroSettings } from '@/components/pomodoro/PomodoroSettings';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ActivePomodoroIndicator: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
    session,
    settings,
    isRunning,
    togglePause,
    stopSession,
    skipSession,
    updateSettings,
  } = usePomodoroTimer();

  if (!session) {
    return (
      <div 
        className="fixed bottom-4 right-4 z-[9999] opacity-0 pointer-events-none transition-opacity duration-200"
        style={{ display: 'none' }}
      />
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[9999] opacity-100 transition-opacity duration-200">
        {expanded ? (
          <div className="bg-background border rounded-lg shadow-lg p-4 w-80">
            <PomodoroDisplay session={session} />
            <PomodoroControls
              session={session}
              isRunning={isRunning}
              onTogglePause={togglePause}
              onStop={() => {
                stopSession();
                setExpanded(false);
              }}
              onSkip={skipSession}
              onOpenSettings={() => setSettingsOpen(true)}
              className="mt-3"
            />
            <button
              onClick={() => setExpanded(false)}
              className="mt-2 text-sm text-muted-foreground hover:text-foreground w-full text-center"
            >
              Minimize
            </button>
          </div>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-colors",
              session.isPaused 
                ? "bg-content-warning border-content-warning-border" 
                : session.sessionType === 'work'
                ? "bg-primary text-primary-foreground"
                : "bg-content-success border-content-success-border"
            )}
          >
            <Clock className="h-4 w-4" />
            <span className="font-medium">{formatTime(session.timeRemaining)}</span>
            {session.isPaused && <span className="text-xs">(Paused)</span>}
          </button>
        )}
      </div>
      
      <PomodoroSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={updateSettings}
      />
    </>
  );
};