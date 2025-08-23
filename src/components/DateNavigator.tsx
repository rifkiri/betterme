
import { PeriodNavigator } from '@/components/ui/standardized';

interface DateNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

/**
 * DateNavigator component - now wraps the standardized PeriodNavigator
 * Maintains backward compatibility while using the unified navigation system
 */
export const DateNavigator = ({ selectedDate, onDateChange }: DateNavigatorProps) => {
  return (
    <PeriodNavigator
      selectedDate={selectedDate}
      onDateChange={onDateChange}
      period="day"
    />
  );
};
