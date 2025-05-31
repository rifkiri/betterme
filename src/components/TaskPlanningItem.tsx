
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Clock, ArrowRight } from 'lucide-react';
import { Task } from '@/types/productivity';

interface TaskPlanningItemProps {
  task: Task;
  showRollOver?: boolean;
  onToggleTask: (id: string) => void;
  onRollOverTask?: (taskId: string) => void;
}

export const TaskPlanningItem = ({ 
  task, 
  showRollOver = false, 
  onToggleTask, 
  onRollOverTask 
}: TaskPlanningItemProps) => {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3">
        <button onClick={() => onToggleTask(task.id)}>
          {task.completed ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-gray-400" />
          )}
        </button>
        <div>
          <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
            {task.title}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'default' : 'secondary'}>
              {task.priority}
            </Badge>
            {task.estimatedTime && (
              <span className="text-sm text-gray-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {task.estimatedTime}
              </span>
            )}
          </div>
        </div>
      </div>
      {showRollOver && !task.completed && onRollOverTask && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onRollOverTask(task.id)}
          className="flex items-center gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          Roll to Tomorrow
        </Button>
      )}
    </div>
  );
};
