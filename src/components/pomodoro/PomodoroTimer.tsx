import React, { useState } from 'react';
import { PomodoroDisplay } from './PomodoroDisplay';
import { PomodoroControls } from './PomodoroControls';
import { PomodoroSettings } from './PomodoroSettings';
import { usePomodoroTimer } from '@/hooks/usePomodoroTimer';
import { Task } from '@/types/productivity';

interface PomodoroTimerProps {
  task?: Task;
  className?: string;
  compact?: boolean;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ task, className, compact = false }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
    session,
    settings,
    isRunning,
    startWork,
    togglePause,
    stopSession,
    skipSession,
    updateSettings,
  } = usePomodoroTimer();

  const handleStart = () => {
    if (task) {
      startWork(task.id, task.title);
    }
  };

  const isCurrentTask = session?.taskId === task?.id;

  if (compact) {
    // Compact mode for inline display in TaskItem
    if (!isCurrentTask && !session) {
      return null;
    }

    if (isCurrentTask) {
      return (
        <div className={className}>
          <PomodoroDisplay session={session} />
          <PomodoroControls
            session={session}
            isRunning={isRunning}
            onTogglePause={togglePause}
            onStop={stopSession}
            onSkip={skipSession}
            onOpenSettings={() => setSettingsOpen(true)}
            className="mt-2"
          />
          <PomodoroSettings
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            settings={settings}
            onSave={updateSettings}
          />
        </div>
      );
    }

    return null;
  }

  // Full mode for standalone display
  return (
    <div className={className}>
      {session ? (
        <>
          <PomodoroDisplay session={session} />
          <PomodoroControls
            session={session}
            isRunning={isRunning}
            onTogglePause={togglePause}
            onStop={stopSession}
            onSkip={skipSession}
            onOpenSettings={() => setSettingsOpen(true)}
            className="mt-4"
          />
        </>
      ) : (
        task && (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Ready to start a Pomodoro session?</p>
            <button
              onClick={handleStart}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Start Timer
            </button>
          </div>
        )
      )}
      <PomodoroSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={updateSettings}
      />
    </div>
  );
};