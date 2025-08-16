
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const DateNavigator = ({ selectedDate, onDateChange }: DateNavigatorProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const goToPreviousDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const goToNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
      <Button
        variant="outline"
        size="sm"
        onClick={goToPreviousDay}
        className="flex items-center gap-1 h-8 px-2 text-xs"
      >
        <ChevronLeft className="h-3 w-3" />
        <span className="hidden xs:inline">Prev</span>
      </Button>
      
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-1 text-xs sm:text-sm font-medium p-1 h-auto"
            >
              <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
              <span className="truncate">
                {format(selectedDate, 'EEE, MMM dd')}
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
        
        {!isToday(selectedDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="text-xs h-6 px-2 shrink-0"
          >
            Today
          </Button>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={goToNextDay}
        className="flex items-center gap-1 h-8 px-2 text-xs"
      >
        <span className="hidden xs:inline">Next</span>
        <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
};
