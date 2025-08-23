
import { useState } from 'react';
import { BaseDialog } from '@/components/ui/base-dialog';
import { useDialog } from '@/hooks/useDialog';
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
  const dialog = useDialog();

  const handleMove = () => {
    if (selectedDate) {
      onMoveOutput(selectedDate);
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
      title="Move Weekly Output"
    >
      <ArrowRight className="h-4 w-4" />
    </Button>
  );

  return (
    <BaseDialog
      open={dialog.open}
      onOpenChange={dialog.setOpen}
      title="Move Weekly Output"
      description="Select a new due date for this weekly output."
      trigger={triggerButton}
      contentClassName="sm:max-w-[425px] max-h-[90vh] flex flex-col"
      headerClassName="shrink-0"
    >
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
        <Button variant="outline" onClick={dialog.closeDialog}>
          Cancel
        </Button>
        <Button onClick={handleMove} disabled={!selectedDate}>
          Move Output
        </Button>
      </div>
    </BaseDialog>
  );
};
