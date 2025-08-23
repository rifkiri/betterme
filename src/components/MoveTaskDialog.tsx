
import { useState } from 'react';
import { BaseDialog } from '@/components/ui/base-dialog';
import { useDialog } from '@/hooks/useDialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface MoveTaskDialogProps {
  onMoveTask: (targetDate: Date) => void;
  disabled?: boolean;
}

export const MoveTaskDialog = ({ onMoveTask, disabled }: MoveTaskDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const dialog = useDialog();

  const handleMove = () => {
    if (selectedDate) {
      // Ensure we pass a proper date object with time set to noon to avoid timezone issues
      const dateToUse = new Date(selectedDate);
      dateToUse.setHours(12, 0, 0, 0);
      onMoveTask(dateToUse);
      dialog.closeDialog();
      setSelectedDate(undefined);
    }
  };

  const triggerButton = (
    <Button 
      size="sm" 
      variant="outline" 
      disabled={disabled}
      className="h-8 w-8 p-0"
      title="Move Task"
    >
      <ArrowRight className="h-4 w-4" />
    </Button>
  );

  return (
    <BaseDialog 
      open={dialog.open} 
      onOpenChange={dialog.setOpen}
      title="Move Task"
      description="Select a date to move this task to."
      trigger={triggerButton}
      contentClassName="sm:max-w-[425px]"
    >
      <div className="flex flex-col items-center space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border pointer-events-auto"
          initialFocus
        />
        {selectedDate && (
          <p className="text-sm text-gray-600">
            Moving to: {format(selectedDate, 'MMMM dd, yyyy')}
          </p>
        )}
        <div className="flex space-x-2">
          <Button variant="outline" onClick={dialog.closeDialog}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={!selectedDate}>
            Move Task
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
};
