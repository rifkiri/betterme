import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MoveGoalDialogProps {
  onMoveGoal: (newDeadline: Date) => void;
  disabled?: boolean;
}

export const MoveGoalDialog = ({ onMoveGoal, disabled = false }: MoveGoalDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleMoveGoal = () => {
    if (selectedDate) {
      // Set to end of day in local time to avoid timezone issues
      const deadline = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59, 999);
      onMoveGoal(deadline);
      setOpen(false);
      setSelectedDate(undefined);
    }
  };

  // Get today's date and set time to start of day for proper comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          variant="outline" 
          disabled={disabled}
          className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50"
        >
          <Clock className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move Goal Deadline</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">New Deadline</label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  {selectedDate ? (
                    format(selectedDate, "PPP")
                  ) : (
                    <span>Pick a new deadline</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      // Create date in local timezone to avoid timezone conversion issues
                      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                      setSelectedDate(localDate);
                      setCalendarOpen(false);
                    }
                  }}
                  disabled={(date) => {
                    const dateToCheck = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    return dateToCheck < today;
                  }}
                  initialFocus
                  className="p-3"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMoveGoal} disabled={!selectedDate}>
              Move Goal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};