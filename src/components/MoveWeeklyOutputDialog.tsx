
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface MoveWeeklyOutputDialogProps {
  onMoveOutput: (targetDate: Date) => void;
  disabled?: boolean;
}

export const MoveWeeklyOutputDialog = ({ onMoveOutput, disabled }: MoveWeeklyOutputDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [open, setOpen] = useState(false);

  const handleMove = () => {
    if (selectedDate) {
      onMoveOutput(selectedDate);
      setOpen(false);
      setSelectedDate(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          variant="outline" 
          disabled={disabled}
          className="flex items-center gap-1 text-xs"
        >
          <ArrowRight className="h-3 w-3" />
          Move
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Move Weekly Output</DialogTitle>
          <DialogDescription>
            Select a new due date for this weekly output.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
          {selectedDate && (
            <p className="text-sm text-gray-600">
              Moving to: {format(selectedDate, 'MMMM dd, yyyy')}
            </p>
          )}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMove} disabled={!selectedDate}>
              Move Output
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
