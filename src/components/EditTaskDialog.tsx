import { useState } from 'react';
import { WeeklyOutput, Task } from '@/types/productivity';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaskForm } from './task/TaskForm';
import { TaskFormValues } from './task/taskFormSchema';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (values: TaskFormValues) => {
    setIsSubmitting(true);
    try {
      console.log('EditTaskDialog - Form values received:', values);
      console.log('EditTaskDialog - About to call onSave with task ID:', task.id);
      
      await onSave(task.id, {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority,
        estimatedTime: values.estimatedTime || undefined,
        dueDate: values.dueDate,
        weeklyOutputId: values.weeklyOutputId === "" ? undefined : values.weeklyOutputId,
        taggedUsers: values.taggedUsers || [],
        visibility: values.visibility || 'all'
      });
      
      console.log('EditTaskDialog - onSave completed, calling onRefresh');
      onRefresh?.();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
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
    taggedUsers: task.taggedUsers || [],
    visibility: task.visibility || 'all'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update your task details.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] px-1">
          <div className="pb-4">
            <TaskForm 
              initialValues={taskAsFormValues}
              onSubmit={handleFormSubmit}
              onCancel={handleCancel}
              weeklyOutputs={weeklyOutputs}
            />
          </div>
        </ScrollArea>
        
        <div className="flex justify-end space-x-2 pt-4 border-t shrink-0">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};