import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, CheckCircle } from 'lucide-react';
import { Task } from '@/types/productivity';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ListDialog } from '@/components/ui/list-dialog';
import { useDialog } from '@/hooks/useDialog';

interface CompletedTasksDialogProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
}

export const CompletedTasksDialog = ({ 
  tasks,
  onToggleTask
}: CompletedTasksDialogProps) => {
  const dialog = useDialog();
  const { toast } = useToast();
  const completedTasks = tasks.filter(task => task.completed);

  const handleToggleTask = (taskId: string) => {
    onToggleTask(taskId);
    toast({
      title: "Task reverted",
      description: "Task moved back to active status",
    });
  };

  const renderTask = (task: Task) => (
    <div className="flex items-start gap-3">
      <button onClick={() => handleToggleTask(task.id)} className="mt-1">
        <CheckCircle className="h-4 w-4 text-amber-600" />
      </button>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{task.title}</p>
        <div className="flex items-center space-x-2 mt-1">
          <Badge variant={
            task.priority === 'High' ? 'destructive' : 
            task.priority === 'Medium' ? 'default' : 'secondary'
          } className="text-xs">
            {task.priority}
          </Badge>
          {task.estimatedTime && (
            <span className="text-xs text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {task.estimatedTime}
            </span>
          )}
        </div>
        {task.dueDate && (
          <p className="text-xs text-muted-foreground mt-1">
            Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <ListDialog
      open={dialog.open}
      onOpenChange={dialog.setOpen}
      title="Completed Tasks"
      description="View your completed tasks and achievements"
      headerIcon={<Trophy className="h-5 w-5 text-amber-600" />}
      maxWidth="md"
      scrollHeight="80"
      gradientItems={true}
      items={completedTasks}
      renderItem={renderTask}
      triggerIcon={<Trophy className="h-4 w-4 text-amber-600" />}
      triggerText="Completed"
      emptyMessage="No completed tasks yet"
    />
  );
};