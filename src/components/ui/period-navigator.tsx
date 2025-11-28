import * as React from "react";
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  addDays, 
  subDays, 
  addWeeks, 
  subWeeks,
  addMonths, 
  subMonths,
  startOfWeek, 
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isToday, 
  isSameWeek,
  isSameMonth 
} from 'date-fns';
import { cn } from '@/lib/utils';
import { getBiWeeklyInterval, isSameBiWeek } from '@/utils/dateUtils';

export type NavigationPeriod = 'day' | 'week' | 'biweek' | 'month';

export interface PeriodNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  period?: NavigationPeriod;
  className?: string;
  showCalendar?: boolean;
  compactMode?: boolean;
}

/**
 * Unified navigation component for day/week/month navigation
 * Provides consistent styling and behavior across all date navigation needs
 */
export const PeriodNavigator = ({
  selectedDate,
  onDateChange,
  period = 'day',
  className,
  showCalendar = true,
  compactMode = false
}: PeriodNavigatorProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const navigate = (direction: 'prev' | 'next') => {
    const multiplier = direction === 'next' ? 1 : -1;
    
    switch (period) {
      case 'day':
        onDateChange(addDays(selectedDate, multiplier));
        break;
      case 'week':
        onDateChange(addWeeks(selectedDate, multiplier));
        break;
      case 'biweek':
        onDateChange(addWeeks(selectedDate, multiplier * 2));
        break;
      case 'month':
        onDateChange(addMonths(selectedDate, multiplier));
        break;
    }
  };

  const goToCurrent = () => {
    onDateChange(new Date());
  };

  const formatDisplay = () => {
    switch (period) {
      case 'day':
        return format(selectedDate, compactMode ? 'MMM dd' : 'EEE, MMM dd');
      case 'week': {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
        return `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`;
      }
      case 'biweek': {
        const { start, end } = getBiWeeklyInterval(selectedDate);
        return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd')}`;
      }
      case 'month':
        return format(selectedDate, 'MMMM yyyy');
    }
  };

  const isCurrentPeriodCheck = () => {
    const today = new Date();
    switch (period) {
      case 'day':
        return isToday(selectedDate);
      case 'week':
        return isSameWeek(selectedDate, today, { weekStartsOn: 0 });
      case 'biweek':
        return isSameBiWeek(selectedDate, today);
      case 'month':
        return isSameMonth(selectedDate, today);
    }
  };

  const getPrevNextLabels = () => {
    switch (period) {
      case 'day':
        return { prev: 'Prev', next: 'Next' };
      case 'week':
        return { prev: 'Prev Week', next: 'Next Week' };
      case 'biweek':
        return { prev: 'Prev Period', next: 'Next Period' };
      case 'month':
        return { prev: 'Previous', next: 'Next' };
    }
  };

  const getCurrentLabel = () => {
    switch (period) {
      case 'day':
        return 'Today';
      case 'week':
        return 'Current Week';
      case 'biweek':
        return 'Current Period';
      case 'month':
        return 'Current Month';
    }
  };

  const labels = getPrevNextLabels();
  const currentLabel = getCurrentLabel();

  return (
    <div className={cn(
      "flex items-center justify-between p-2 bg-background-secondary rounded-lg",
      className
    )}>
      <Button
        size="sm"
        variant="outline"
        onClick={() => navigate('prev')}
        className="flex items-center gap-1 h-8 px-2 text-xs"
      >
        <ChevronLeft className="h-3 w-3" />
        <span className={cn(compactMode ? "hidden" : "hidden xs:inline")}>
          {labels.prev}
        </span>
      </Button>
      
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        {showCalendar ? (
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex items-center gap-1 font-medium p-1 h-auto",
                  compactMode ? "text-xs" : "text-xs sm:text-sm"
                )}
              >
                <CalendarIcon className={cn(
                  "text-muted-foreground shrink-0",
                  compactMode ? "h-3 w-3" : "h-3 w-3 sm:h-4 sm:w-4"
                )} />
                <span className="truncate">
                  {formatDisplay()}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    onDateChange(date);
                    setIsCalendarOpen(false);
                  }
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        ) : (
          <div className={cn(
            "flex items-center gap-1 font-medium",
            compactMode ? "text-xs" : "text-sm"
          )}>
            <CalendarIcon className={cn(
              "text-muted-foreground",
              compactMode ? "h-3 w-3" : "h-4 w-4"
            )} />
            <span>{formatDisplay()}</span>
          </div>
        )}
        
        {!isCurrentPeriodCheck() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={goToCurrent}
            className={cn(
              "shrink-0",
              compactMode ? "text-xs h-6 px-2" : "text-xs h-6 px-2"
            )}
          >
            {currentLabel}
          </Button>
        )}
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={() => navigate('next')}
        className="flex items-center gap-1 h-8 px-2 text-xs"
      >
        <span className={cn(compactMode ? "hidden" : "hidden xs:inline")}>
          {labels.next}
        </span>
        <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
};