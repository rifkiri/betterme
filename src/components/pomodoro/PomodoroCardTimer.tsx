import React, { useState } from 'react';
import { ContentCard } from '@/components/ui/content-card';
import { IconButton } from '@/components/ui/icon-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { StatusBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  Settings, 
  Minimize2, 
  X,
  Clock,
  Coffee,
  Target
} from 'lucide-react';
import { ActivePomodoroSession } from '@/services/SupabaseActivePomodoroService';
import { PomodoroSessionSettings } from '@/hooks/usePomodoroSessionManager';
import { PomodoroSettings } from './PomodoroSettings';
import { getSessionStartAction, getStartButtonTooltip } from '@/utils/pomodoroSessionHelpers';

interface PomodoroCardTimerProps {
  session: ActivePomodoroSession | null;
  settings: PomodoroSessionSettings;
  isRunning: boolean;
  timeRemaining: number;
  onStart: () => void;
  onStartBreak: (type: 'short_break' | 'long_break') => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSkip: () => void;
  onUpdateSettings: (settings: PomodoroSessionSettings) => void;
  onMinimize: () => void;
  onClose: () => void;
}

export const PomodoroCardTimer: React.FC<PomodoroCardTimerProps> = ({
  session,
  settings,
  isRunning,
  timeRemaining,
  onStart,
  onStartBreak,
  onPause,
  onResume,
  onStop,
  onSkip,
  onUpdateSettings,
  onMinimize,
  onClose,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!session) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentSessionDuration = () => {
    switch (session.current_session_type) {
      case 'work':
        return settings.workDuration;
      case 'short_break':
        return settings.shortBreakDuration;
      case 'long_break':
        return settings.longBreakDuration;
      default:
        return 25;
    }
  };

  const totalSeconds = getCurrentSessionDuration() * 60;
  const progressPercentage = totalSeconds > 0 ? ((totalSeconds - timeRemaining) / totalSeconds) * 100 : 0;

  const getSessionIcon = () => {
    switch (session.current_session_type) {
      case 'work':
        return <Target className="h-5 w-5" />;
      case 'short_break':
      case 'long_break':
        return <Coffee className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getSessionLabel = () => {
    switch (session.current_session_type) {
      case 'work':
        return 'Work Session';
      case 'short_break':
        return 'Short Break';
      case 'long_break':
        return 'Long Break';
      default:
        return 'Session';
    }
  };

  const getCardVariant = () => {
    if (session.session_status === 'active-paused') return 'warning';
    if (session.current_session_type === 'work') return 'default';
    return 'success';
  };

  const getBadgeStatus = () => {
    if (session.session_status === 'active-paused') return 'medium' as const;
    if (session.session_status === 'active-running') return 'high' as const;
    return 'low' as const;
  };

  const getStatusText = () => {
    switch (session.session_status) {
      case 'active-running':
        return 'Running';
      case 'active-paused':
        return 'Paused';
      case 'active-stopped':
        return 'Stopped';
      default:
        return 'Active';
    }
  };

  return (
    <>
      <ContentCard variant={getCardVariant()}>
        <div className="space-y-4">
          {/* Header with session info and controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getSessionIcon()}
              <span className="font-medium">{getSessionLabel()}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={getBadgeStatus()}>
                {getStatusText()}
              </StatusBadge>
              <IconButton
                icon={<Minimize2 className="h-4 w-4" />}
                onClick={onMinimize}
                tooltip="Minimize timer"
                variant="ghost"
              />
            </div>
          </div>

          {/* Task title if present */}
          {session.task_title && (
            <div className="text-sm text-muted-foreground">
              Working on: <span className="font-medium text-foreground">{session.task_title}</span>
            </div>
          )}

          {/* Timer display */}
          <div className="space-y-3">
            <div className="text-4xl font-bold text-center">
              {formatTime(timeRemaining)}
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          {/* Session stats */}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Work sessions: {session.completed_work_sessions}</span>
            <span>Breaks: {session.completed_break_sessions}</span>
          </div>

          {/* Controls */}
          <div className="flex justify-center">
            <ActionButtonGroup
              customActions={
                <>
                  <IconButton
                    icon={isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    onClick={getSessionStartAction(session, isRunning, {
                      startWork: onStart,
                      startBreak: onStartBreak,
                      resumeWork: onResume,
                      togglePause: onPause
                    })}
                    tooltip={getStartButtonTooltip(session, isRunning)}
                    variant="default"
                  />
                  
                  {session.session_status !== 'active-stopped' && (
                    <IconButton
                      icon={<Square className="h-4 w-4" />}
                      onClick={onStop}
                      tooltip="Stop timer"
                      colorScheme="destructive"
                      variant="outline"
                    />
                  )}
                  
                  <IconButton
                    icon={<SkipForward className="h-4 w-4" />}
                    onClick={onSkip}
                    tooltip="Skip to next session"
                    variant="outline"
                  />
                  
                  <IconButton
                    icon={<Settings className="h-4 w-4" />}
                    onClick={() => setSettingsOpen(true)}
                    tooltip="Timer settings"
                    variant="outline"
                  />
                  
                  <IconButton
                    icon={<X className="h-4 w-4" />}
                    onClick={onClose}
                    tooltip="Terminate session"
                    variant="outline"
                    colorScheme="destructive"
                  />
                </>
              }
            />
          </div>
        </div>
      </ContentCard>

      <PomodoroSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={onUpdateSettings}
      />
    </>
  );
};