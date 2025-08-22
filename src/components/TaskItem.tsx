import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Clock, ArrowRight, Trash2, Target, Calendar, Users, Eye } from 'lucide-react';
import { Task, WeeklyOutput } from '@/types/productivity';
import { MoveTaskDialog } from './MoveTaskDialog';
import { EditTaskDialog } from './EditTaskDialog';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface TaskItemProps {
  task: Task;
  onToggleTask: (id: string) => void;
  onEditTask: (id: string, updates: Partial<Task>) => Promise<void>;
  onMoveTask: (taskId: string, targetDate: Date) => void;
  onDeleteTask: (id: string) => void;
  onViewDetails?: () => void;
  weeklyOutputs?: WeeklyOutput[];
}

interface TaggedUser {
  id: string;
  name: string;
}

export const TaskItem = ({ task, onToggleTask, onEditTask, onMoveTask, onDeleteTask, onViewDetails, weeklyOutputs = [] }: TaskItemProps) => {
  const [taggedUsers, setTaggedUsers] = useState<TaggedUser[]>([]);
  const linkedOutput = task.weeklyOutputId ? weeklyOutputs.find(output => output.id === task.weeklyOutputId) : null;

  useEffect(() => {
    if (task.taggedUsers && task.taggedUsers.length > 0) {
      fetchTaggedUsers();
    } else {
      // Clear tagged users if no tagged users exist
      setTaggedUsers([]);
    }
  }, [task.taggedUsers]); // Add task.taggedUsers as dependency to react to changes

  const fetchTaggedUsers = async () => {
    if (!task.taggedUsers || task.taggedUsers.length === 0) {
      setTaggedUsers([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', task.taggedUsers);

      if (error) {
        console.error('Error fetching tagged users:', error);
        return;
      }

      setTaggedUsers(data || []);
    } catch (error) {
      console.error('Error fetching tagged users:', error);
    }
  };

  const formatDueDate = (dueDate: Date) => {
    if (isToday(dueDate)) {
      return 'Today';
    } else if (isTomorrow(dueDate)) {
      return 'Tomorrow';
    } else {
      return format(dueDate, 'MMM dd');
    }
  };

  const getDueDateColor = (dueDate: Date, completed: boolean) => {
    if (completed) return 'text-gray-500';
    if (isPast(dueDate) && !isToday(dueDate)) return 'text-red-500';
    if (isToday(dueDate)) return 'text-orange-500';
    return 'text-gray-500';
  };

  const isOverdue = () => {
    return task.dueDate && isPast(task.dueDate) && !isToday(task.dueDate) && !task.completed;
  };

  return (
    <div className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
      isOverdue() ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'hover:bg-gray-50'
    }`}>
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
            {linkedOutput && (
              <Badge variant="outline" className="text-xs flex items-center gap-1 bg-blue-50 text-blue-600 border-blue-200">
                <Target className="h-2 w-2" />
                Linked to Output
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'default' : 'secondary'} className="text-xs">
              {task.priority}
            </Badge>
            {task.dueDate && (
              <span className={`text-xs flex items-center ${getDueDateColor(task.dueDate, task.completed)}`}>
                <Calendar className="h-3 w-3 mr-1" />
                {formatDueDate(task.dueDate)}
                {isOverdue() && ' (Overdue)'}
              </span>
            )}
            {task.estimatedTime && (
              <span className="text-xs text-gray-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {task.estimatedTime}
              </span>
            )}
          </div>
          {taggedUsers.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Users className="h-3 w-3 text-blue-500" />
              <div className="flex flex-wrap gap-1">
                {taggedUsers.map((user) => (
                  <Badge key={user.id} variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                    {user.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {linkedOutput && (
            <div className="text-xs text-blue-600 mt-1 truncate">
              → {linkedOutput.title}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewDetails}
          className="h-8 w-8 p-0"
          title="View Details"
        >
          <Eye className="h-4 w-4" />
        </Button>
        {!task.completed && (
          <MoveTaskDialog 
            onMoveTask={(newDate) => onMoveTask(task.id, newDate)}
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteTask(task.id)}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
