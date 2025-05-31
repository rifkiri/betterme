
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, RotateCcw, Clock } from 'lucide-react';
import { Task } from '@/types/productivity';

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
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          Deleted ({deletedTasks.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Deleted Tasks</DialogTitle>
          <DialogDescription>
            Restore or permanently delete your deleted tasks
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {deletedTasks.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No deleted tasks</p>
          ) : (
            deletedTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
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
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
