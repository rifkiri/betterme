import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock } from 'lucide-react';
import { Task } from '@/types/productivity';
import { format } from 'date-fns';

interface CompletedTasksDialogProps {
  tasks: Task[];
}

export const CompletedTasksDialog = ({ 
  tasks
}: CompletedTasksDialogProps) => {
  const [open, setOpen] = useState(false);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-600" />
          Completed ({completedTasks.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600" />
            Completed Tasks
          </DialogTitle>
          <DialogDescription>
            View your completed tasks and achievements
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {completedTasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No completed tasks yet</p>
          ) : (
            completedTasks.map(task => (
              <div key={task.id} className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
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
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};