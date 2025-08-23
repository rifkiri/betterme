
import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, isSameWeek } from 'date-fns';

interface WeekNavigatorProps {
  selectedWeek: Date;
  onNavigateWeek: (direction: 'prev' | 'next') => void;
  onGoToCurrentWeek: () => void;
}

export const WeekNavigator = ({
  selectedWeek,
  onNavigateWeek,
  onGoToCurrentWeek,
}: WeekNavigatorProps) => {
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 0 });
  const today = new Date();
  const isCurrentWeek = isSameWeek(selectedWeek, today, { weekStartsOn: 0 });

  return (
    <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onNavigateWeek('prev')}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Prev Week
      </Button>
      
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium">
          {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd')}
        </span>
        {!isCurrentWeek && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onGoToCurrentWeek}
            className="text-xs"
          >
            Current Week
          </Button>
        )}
      </div>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => onNavigateWeek('next')}
        className="flex items-center gap-1"
      >
        Next Week
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
