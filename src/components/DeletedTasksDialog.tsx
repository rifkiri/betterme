
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw, Clock } from 'lucide-react';
import { Task } from '@/types/productivity';
import { format } from 'date-fns';
import { ListDialog } from '@/components/ui/list-dialog';
import { useDialog } from '@/hooks/useDialog';

interface DeletedTasksDialogProps {
  deletedTasks: Task[];
  onRestoreTask: (id: string) => void;
  onPermanentlyDeleteTask: (id: string) => void;
}

export const DeletedTasksDialog = ({ 
  deletedTasks, 
  onRestoreTask, 
  onPermanentlyDeleteTask 
}: DeletedTasksDialogProps) => {
  const dialog = useDialog();

  const renderTask = (task: Task) => (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">{task.title}</p>
        <div className="flex items-center space-x-2 mt-1">
          <Badge variant={
            task.priority === 'High' ? 'destructive' : 
            task.priority === 'Medium' ? 'default' : 'secondary'
          } className="text-xs">
            {task.priority}
          </Badge>
          {task.estimatedTime && (
            <span className="text-xs text-gray-500 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {task.estimatedTime}
            </span>
          )}
        </div>
        {task.dueDate && (
          <p className="text-xs text-gray-500 mt-1">
            Due: {format(task.dueDate, 'MMM dd, yyyy')}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRestoreTask(task.id)}
          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
          title="Restore task"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPermanentlyDeleteTask(task.id)}
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
      title="Deleted Tasks"
      description="Restore or permanently delete your deleted tasks"
      maxWidth="md"
      scrollHeight="80"
      items={deletedTasks}
      renderItem={renderTask}
      triggerIcon={<Trash2 className="h-4 w-4" />}
      triggerText="Deleted"
      emptyMessage="No deleted tasks"
    />
  );
};
