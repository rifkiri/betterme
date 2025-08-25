import React from 'react';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/ui/status-badge';
import { ContentCard } from '@/components/ui/content-card';
import { PomodoroSession } from '@/hooks/usePomodoroTimer';
import { Clock, Coffee, Target } from 'lucide-react';

interface PomodoroDisplayProps {
  session: PomodoroSession | null;
  className?: string;
}

export const PomodoroDisplay: React.FC<PomodoroDisplayProps> = ({ session, className }) => {
  if (!session) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalSeconds = session.duration * 60;
  const progressPercentage = ((totalSeconds - session.timeRemaining) / totalSeconds) * 100;

  const getSessionIcon = () => {
    switch (session.sessionType) {
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
    switch (session.sessionType) {
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
    if (session.isPaused) return 'warning';
    if (session.sessionType === 'work') return 'default';
    return 'success';
  };

  const getBadgeStatus = () => {
    if (session.isPaused) return 'medium' as const;
    if (session.sessionType === 'work') return 'high' as const;
    return 'low' as const;
  };

  return (
    <ContentCard variant={getCardVariant()} className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getSessionIcon()}
            <span className="font-medium">{getSessionLabel()}</span>
          </div>
          <StatusBadge 
            status={getBadgeStatus()}
          >
            {session.isPaused ? 'Paused' : 'Active'}
          </StatusBadge>
        </div>

        {session.taskTitle && (
          <div className="text-sm text-muted-foreground">
            Working on: <span className="font-medium text-foreground">{session.taskTitle}</span>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-3xl font-bold text-center">
            {formatTime(session.timeRemaining)}
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {session.sessionType === 'work' && session.completedPomodoros > 0 && (
          <div className="text-sm text-center text-muted-foreground">
            Completed Pomodoros: {session.completedPomodoros}
          </div>
        )}
      </div>
    </ContentCard>
  );
};