import React from 'react';
import { IconButton } from '@/components/ui/icon-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Play, Pause, Square, SkipForward, Settings } from 'lucide-react';
import { PomodoroSession } from '@/hooks/usePomodoroTimer';

interface PomodoroControlsProps {
  session: PomodoroSession | null;
  isRunning: boolean;
  onTogglePause: () => void;
  onStop: () => void;
  onSkip: () => void;
  onOpenSettings: () => void;
  className?: string;
}

export const PomodoroControls: React.FC<PomodoroControlsProps> = ({
  session,
  isRunning,
  onTogglePause,
  onStop,
  onSkip,
  onOpenSettings,
  className,
}) => {
  const customActions = (
    <>
      {session && (
        <>
          <IconButton
            icon={session.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            onClick={onTogglePause}
            tooltip={session.isPaused ? 'Resume' : 'Pause'}
            variant="default"
          />
          <IconButton
            icon={<SkipForward className="h-4 w-4" />}
            onClick={onSkip}
            tooltip="Skip to next session"
            variant="outline"
          />
          <IconButton
            icon={<Square className="h-4 w-4" />}
            onClick={onStop}
            tooltip="Stop timer"
            colorScheme="destructive"
            variant="outline"
          />
        </>
      )}
      <IconButton
        icon={<Settings className="h-4 w-4" />}
        onClick={onOpenSettings}
        tooltip="Pomodoro settings"
        variant="outline"
      />
    </>
  );

  return (
    <ActionButtonGroup
      customActions={customActions}
      className={className}
    />
  );
};