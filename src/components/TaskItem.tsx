
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock, ArrowRight } from 'lucide-react';
import { Task } from '@/types/productivity';
import { MoveTaskDialog } from './MoveTaskDialog';

interface TaskItemProps {
  task: Task;
  onToggleTask: (id: string) => void;
  onMoveTask: (taskId: string, targetDate: Date) => void;
}

export const TaskItem = ({ task, onToggleTask, onMoveTask }: TaskItemProps) => {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3 flex-1">
        <button onClick={() => onToggleTask(task.id)}>
          {task.completed ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-gray-400" />
          )}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </p>
            {task.isMoved && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <ArrowRight className="h-2 w-2" />
                Moved
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'default' : 'secondary'} className="text-xs">
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
      </div>
      {!task.completed && (
        <MoveTaskDialog 
          onMoveTask={(newDate) => onMoveTask(task.id, newDate)}
        />
      )}
    </div>
  );
};
