
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw } from 'lucide-react';
import { WeeklyOutput } from '@/types/productivity';
import { ListDialog } from '@/components/ui/list-dialog';
import { useDialog } from '@/hooks/useDialog';

interface DeletedWeeklyOutputsDialogProps {
  deletedWeeklyOutputs: WeeklyOutput[];
  onRestore: (id: string) => void;
  onPermanentlyDelete: (id: string) => void;
}

export const DeletedWeeklyOutputsDialog = ({ 
  deletedWeeklyOutputs, 
  onRestore, 
  onPermanentlyDelete 
}: DeletedWeeklyOutputsDialogProps) => {
  const dialog = useDialog();

  const renderOutput = (output: WeeklyOutput) => (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">{output.title}</p>
        <div className="flex items-center space-x-2 mt-1">
          <Badge variant="secondary" className="text-xs">
            {output.progress}%
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRestore(output.id)}
          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
          title="Restore output"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPermanentlyDelete(output.id)}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
          title="Permanently delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <ListDialog
      open={dialog.open}
      onOpenChange={dialog.setOpen}
      title="Deleted Weekly Outputs"
      description="Restore or permanently delete your deleted weekly outputs"
      maxWidth="md"
      scrollHeight="80"
      items={deletedWeeklyOutputs}
      renderItem={renderOutput}
      triggerIcon={<Trash2 className="h-4 w-4" />}
      triggerText="Deleted"
      emptyMessage="No deleted weekly outputs"
    />
  );
};
