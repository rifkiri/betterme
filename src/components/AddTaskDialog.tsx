
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WeeklyOutput, Task } from '@/types/productivity';
import { TaskForm } from './task/TaskForm';
import { TaskFormValues } from './task/taskFormSchema';

interface AddTaskDialogProps {
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'createdDate' | 'isMoved'>) => void;
  weeklyOutputs: WeeklyOutput[];
}

export const AddTaskDialog = ({
  onAddTask,
  weeklyOutputs
}: AddTaskDialogProps) => {
  const [open, setOpen] = useState(false);

  const handleSubmit = (values: TaskFormValues) => {
    onAddTask({
      title: values.title,
      description: values.description || undefined,
      priority: values.priority,
      estimatedTime: values.estimatedTime || undefined,
      dueDate: values.dueDate || new Date(),
      originalDueDate: values.dueDate || new Date(),
      weeklyOutputId: values.weeklyOutputId || undefined,
      taggedUsers: values.taggedUsers || [],
      visibility: values.visibility || 'all'
    });
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Create a new task to track your work progress.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] px-1">
          <div className="pb-4">
            <TaskForm 
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
          <Button type="submit" form="task-form">Add Task</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
