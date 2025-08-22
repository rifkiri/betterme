
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
  onSave: (taskId: string, updates: Partial<Task>) => void;
  weeklyOutputs: WeeklyOutput[];
  onRefresh?: () => void;
}

export const EditTaskDialog = ({ task, open, onOpenChange, onSave, weeklyOutputs, onRefresh }: EditTaskDialogProps) => {
  const handleSubmit = (values: TaskFormValues) => {
    console.log('EditTaskDialog - Form values received:', values);
    onSave(task.id, {
      title: values.title,
      description: values.description || undefined,
      priority: values.priority,
      estimatedTime: values.estimatedTime || undefined,
      dueDate: values.dueDate,
      weeklyOutputId: values.weeklyOutputId === "" ? undefined : values.weeklyOutputId,
      taggedUsers: values.taggedUsers || []
    });
    onRefresh?.();
    onOpenChange(false);
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
    taggedUsers: task.taggedUsers || []
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
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              weeklyOutputs={weeklyOutputs}
            />
          </div>
        </ScrollArea>
        
        <div className="flex justify-end space-x-2 pt-4 border-t shrink-0">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" form="task-form">Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
