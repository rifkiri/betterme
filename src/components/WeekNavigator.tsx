
import { PeriodNavigator } from '@/components/ui/standardized';
import { addWeeks, subWeeks } from 'date-fns';

interface WeekNavigatorProps {
  selectedWeek: Date;
  onNavigateWeek: (direction: 'prev' | 'next') => void;
  onGoToCurrentWeek: () => void;
}

/**
 * WeekNavigator component - now wraps the standardized PeriodNavigator
 * Maintains backward compatibility while using the unified navigation system
 */
export const WeekNavigator = ({
  selectedWeek,
  onNavigateWeek,
  onGoToCurrentWeek,
}: WeekNavigatorProps) => {
  const handleDateChange = (date: Date) => {
    const diff = date.getTime() - selectedWeek.getTime();
    const weeksDiff = Math.round(diff / (7 * 24 * 60 * 60 * 1000));
    
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
      period="week"
      className="mb-4"
    />
  );
};
