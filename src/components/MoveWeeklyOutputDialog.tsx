
import { CalendarDialog } from '@/components/ui/calendar-dialog';
import { ArrowRight } from 'lucide-react';

interface MoveWeeklyOutputDialogProps {
  onMoveOutput: (targetDate: Date) => void;
  disabled?: boolean;
}

export const MoveWeeklyOutputDialog = ({ onMoveOutput, disabled }: MoveWeeklyOutputDialogProps) => {
  return (
    <CalendarDialog
      onSelectDate={onMoveOutput}
      disabled={disabled}
      title="Move Bi-Weekly Output"
      description="Select a new due date for this bi-weekly output."
      buttonText="Move Output"
      triggerIcon={<ArrowRight className="h-4 w-4" />}
      triggerTitle="Move Bi-Weekly Output"
      dateProcessing="as-is"
      layout="scroll"
      contentClassName="sm:max-w-[425px] max-h-[90vh] flex flex-col"
    />
  );
};
