import { CalendarDialog } from '@/components/ui/calendar-dialog';
import { Clock } from 'lucide-react';

interface MoveGoalDialogProps {
  onMoveGoal: (newDeadline: Date) => void;
  disabled?: boolean;
}

export const MoveGoalDialog = ({ onMoveGoal, disabled = false }: MoveGoalDialogProps) => {
  return (
    <CalendarDialog
      onSelectDate={onMoveGoal}
      disabled={disabled}
      title="Move Goal Deadline"
      buttonText="Move Goal"
      triggerIcon={<Clock className="h-4 w-4" />}
      triggerClassName="text-blue-600 hover:bg-blue-50"
      triggerTitle="Move Goal Deadline"
      dateProcessing="end-of-day"
      layout="popover"
      disablePastDates={true}
      contentClassName="sm:max-w-md"
      label="New Deadline"
      placeholder="Pick a new deadline"
    />
  );
};