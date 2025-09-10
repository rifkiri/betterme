import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Timer } from 'lucide-react';

interface PomodoroCounterProps {
  count: number;
  duration: number;
  isLoading?: boolean;
  className?: string;
}

/**
 * Reusable Pomodoro counter component with consistent styling
 * Shows work session count and total duration
 */
export const PomodoroCounter: React.FC<PomodoroCounterProps> = ({
  count,
  duration,
  isLoading = false,
  className = ""
}) => {
  const formatDuration = (minutes: number): string => {
    if (minutes === 0) return '0m';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <Badge variant="outline" className={`gap-1 ${className}`}>
        <Timer className="h-3 w-3" />
        <span>...</span>
      </Badge>
    );
  }

  if (count === 0) {
    return null; // Don't show counter if no sessions completed
  }

  return (
    <Badge variant="outline" className={`gap-1 ${className}`}>
      <Timer className="h-3 w-3" />
      <span>{count} ({formatDuration(duration)})</span>
    </Badge>
  );
};