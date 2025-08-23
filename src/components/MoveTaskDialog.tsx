
import { CalendarDialog } from '@/components/ui/calendar-dialog';
import { ArrowRight } from 'lucide-react';

interface MoveTaskDialogProps {
  onMoveTask: (targetDate: Date) => void;
  disabled?: boolean;
}

export const MoveTaskDialog = ({ onMoveTask, disabled }: MoveTaskDialogProps) => {
  return (
    <CalendarDialog
      onSelectDate={onMoveTask}
      disabled={disabled}
      title="Move Task"
      description="Select a date to move this task to."
      buttonText="Move Task"
      triggerIcon={<ArrowRight className="h-4 w-4" />}
      triggerTitle="Move Task"
      dateProcessing="noon"
      layout="direct"
      contentClassName="sm:max-w-[425px]"
    />
  );
};
