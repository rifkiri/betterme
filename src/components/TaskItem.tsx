import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock, ArrowRight, Trash2, Users } from 'lucide-react';
import { Task, WeeklyOutput } from '@/types/productivity';
import { MoveTaskDialog } from './MoveTaskDialog';
import { EditTaskDialog } from './EditTaskDialog';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { ItemCard, StatusBadge, LinkBadge, DateDisplay } from '@/components/ui/standardized';

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
    <ItemCard
      isCompleted={task.completed}
      isOverdue={isOverdue()}
      actions={{
        onView: onViewDetails,
        onDelete: () => onDeleteTask(task.id),
        customActions: !task.completed && (
          <MoveTaskDialog 
            onMoveTask={(newDate) => onMoveTask(task.id, newDate)}
          />
        )
      }}
      header={
        <div className="flex items-center space-x-3">
          <button onClick={() => onToggleTask(task.id)}>
            {task.completed ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4 text-gray-400" />
            )}
          </button>
          <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
            {task.title}
          </p>
        </div>
      }
      badges={
        <>
          {task.isMoved && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <ArrowRight className="h-2 w-2" />
              Moved
            </Badge>
          )}
          {linkedOutput && (
            <LinkBadge variant="info">
              {linkedOutput.title}
            </LinkBadge>
          )}
          <StatusBadge status={task.priority === 'High' ? 'high' : task.priority === 'Medium' ? 'medium' : 'low'}>
            {task.priority}
          </StatusBadge>
          {taggedUsers.length > 0 && taggedUsers.map((user) => (
            <Badge key={user.id} variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
              {user.name}
            </Badge>
          ))}
        </>
      }
      metadata={
        <>
          {task.dueDate && (
            <DateDisplay 
              date={task.dueDate}
              isOverdue={isOverdue()}
              prefix="Due:"
            />
          )}
          {task.estimatedTime && (
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {task.estimatedTime}
            </span>
          )}
          {taggedUsers.length > 0 && (
            <span className="flex items-center">
              <Users className="h-3 w-3 mr-1" />
              {taggedUsers.length} assigned
            </span>
          )}
        </>
      }
    >
      {/* Main content area - can include description or other details */}
      {task.description && (
        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
      )}
    </ItemCard>
  );
};
