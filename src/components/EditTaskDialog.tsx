
import { useState } from 'react';
import { WeeklyOutput, Task } from '@/types/productivity';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskForm } from './task/TaskForm';
import { TaskFormValues } from './task/taskFormSchema';

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (taskId: string, updates: Partial<Task>) => void;
  weeklyOutputs: WeeklyOutput[];
}

export const EditTaskDialog = ({ task, open, onOpenChange, onSave, weeklyOutputs }: EditTaskDialogProps) => {
  const handleSubmit = (values: TaskFormValues) => {
    onSave(task.id, {
      title: values.title,
      description: values.description || undefined,
      priority: values.priority,
      estimatedTime: values.estimatedTime || undefined,
      dueDate: values.dueDate,
      weeklyOutputId: values.weeklyOutputId || undefined
    });
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
    weeklyOutputId: task.weeklyOutputId || undefined
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update your task details.
          </DialogDescription>
        </DialogHeader>
        <TaskForm 
          initialValues={taskAsFormValues}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          weeklyOutputs={weeklyOutputs}
        />
      </DialogContent>
    </Dialog>
  );
};
