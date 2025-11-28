
import { PeriodNavigator } from '@/components/ui/standardized';
import { addWeeks, subWeeks } from 'date-fns';

interface WeekNavigatorProps {
  selectedWeek: Date;
  onNavigateWeek: (direction: 'prev' | 'next') => void;
  onGoToCurrentWeek: () => void;
  biWeekly?: boolean;
}

/**
 * WeekNavigator component - now wraps the standardized PeriodNavigator
 * Supports both weekly and bi-weekly navigation modes
 */
export const WeekNavigator = ({
  selectedWeek,
  onNavigateWeek,
  onGoToCurrentWeek,
  biWeekly = false,
}: WeekNavigatorProps) => {
  const handleDateChange = (date: Date) => {
    const diff = date.getTime() - selectedWeek.getTime();
    const weeksDiff = Math.round(diff / (7 * 24 * 60 * 60 * 1000));
    
    // Both weekly and bi-weekly now navigate by 1-week steps
    // (bi-weekly shows 2 weeks but rolls by 1 week)
    if (weeksDiff === 0) {
      onGoToCurrentWeek();
    } else if (weeksDiff > 0) {
      for (let i = 0; i < weeksDiff; i++) {
        onNavigateWeek('next');
      }
    } else {
      for (let i = 0; i < Math.abs(weeksDiff); i++) {
        onNavigateWeek('prev');
      }
    }
  };

  return (
    <PeriodNavigator
      selectedDate={selectedWeek}
      onDateChange={handleDateChange}
      period={biWeekly ? "biweek" : "week"}
      className="mb-4"
    />
  );
};
