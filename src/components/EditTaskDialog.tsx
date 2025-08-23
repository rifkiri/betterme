import { WeeklyOutput, Task } from '@/types/productivity';
import { FormDialog } from '@/components/ui/standardized';
import { TaskForm } from './task/TaskForm';
import { TaskFormValues } from './task/taskFormSchema';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (taskId: string, updates: Partial<Task>) => Promise<void>;
  weeklyOutputs: WeeklyOutput[];
  onRefresh?: () => void;
}

export const EditTaskDialog = ({ 
  task, 
  open, 
  onOpenChange, 
  onSave, 
  weeklyOutputs, 
  onRefresh 
}: EditTaskDialogProps) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission is handled by TaskForm
  };

  const handleFormSubmit = async (values: TaskFormValues) => {
    console.log('EditTaskDialog - Form values received:', values);
    console.log('EditTaskDialog - About to call onSave with task ID:', task.id);
    
    await onSave(task.id, {
      title: values.title,
      description: values.description || undefined,
      priority: values.priority,
      estimatedTime: values.estimatedTime || undefined,
      dueDate: values.dueDate,
      weeklyOutputId: values.weeklyOutputId === "" ? undefined : values.weeklyOutputId,
      taggedUsers: values.taggedUsers || []
    });
    
    console.log('EditTaskDialog - onSave completed, calling onRefresh');
    onRefresh?.();
    onOpenChange(false);
  };

  // Convert task to form values
  const taskAsFormValues: TaskFormValues = {
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    estimatedTime: task.estimatedTime || '',
    dueDate: task.dueDate || new Date(),
    weeklyOutputId: task.weeklyOutputId || undefined,
    taggedUsers: task.taggedUsers || []
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Task"
      description="Update your task details."
      onSubmit={handleSubmit}
      submitText="Save Changes"
      contentClassName="sm:max-w-[425px]"
      showFooter={false}
    >
      <ScrollArea className="h-[60vh] px-1">
        <div className="pb-4">
          <TaskForm 
            initialValues={taskAsFormValues}
            onSubmit={handleFormSubmit}
            onCancel={() => onOpenChange(false)}
            weeklyOutputs={weeklyOutputs}
          />
        </div>
      </ScrollArea>
    </FormDialog>
  );
};