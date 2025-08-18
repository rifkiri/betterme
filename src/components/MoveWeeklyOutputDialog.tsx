
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
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
          className="h-8 w-8 p-0"
          title="Move Weekly Output"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Move Weekly Output</DialogTitle>
          <DialogDescription>
            Select a new due date for this weekly output.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-1">
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
          </div>
        </ScrollArea>
        
        <div className="flex justify-center space-x-2 pt-4 shrink-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={!selectedDate}>
            Move Output
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
