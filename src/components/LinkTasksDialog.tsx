import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'lucide-react';
import { Task } from '@/types/productivity';
import { format } from 'date-fns';

interface LinkTasksDialogProps {
  outputId: string;
  linkedTaskIds: string[];
  availableTasks: Task[];
  onUpdateLinks: (outputId: string, taskIds: string[]) => void;
}

export const LinkTasksDialog = ({
  outputId,
  linkedTaskIds,
  availableTasks,
  onUpdateLinks
}: LinkTasksDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(linkedTaskIds);

  const handleSave = () => {
    onUpdateLinks(outputId, selectedTaskIds);
    setOpen(false);
  };

  const handleTaskToggle = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTaskIds(prev => [...prev, taskId]);
    } else {
      setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'urgent': return 'bg-red-200 text-red-900';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 text-xs">
          <Link className="h-3 w-3" />
          Link Tasks ({linkedTaskIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Link Tasks to Output</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-3">
          {availableTasks.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No tasks available to link</p>
          ) : (
            availableTasks.map((task) => {
              const isSelected = selectedTaskIds.includes(task.id);
              const isLinked = linkedTaskIds.includes(task.id);
              
              return (
                <div 
                  key={task.id} 
                  className={`border rounded-lg p-3 transition-colors ${
                    isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleTaskToggle(task.id, !!checked)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium text-sm ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </h3>
                        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                        {task.completed && (
                          <Badge variant="secondary" className="text-xs">
                            Completed
                          </Badge>
                        )}
                        {isLinked && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                            Currently Linked
                          </Badge>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Due: {format(task.dueDate, 'MMM dd, yyyy')}</span>
                        {task.estimatedTime && (
                          <span>Est: {task.estimatedTime}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-sm text-gray-600">
            {selectedTaskIds.length} task{selectedTaskIds.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Update Links
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};