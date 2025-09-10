import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock, ArrowRight, Users, Timer } from 'lucide-react';
import { Task, WeeklyOutput } from '@/types/productivity';
import { MoveTaskDialog } from './MoveTaskDialog';
import { EditTaskDialog } from './EditTaskDialog';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { ItemCard, StatusBadge, LinkBadge, DateDisplay } from '@/components/ui/standardized';
import { IconButton } from '@/components/ui/icon-button';
import { usePomodoroSessionManager } from '@/hooks/usePomodoroSessionManager';
import { SupabasePomodoroService } from '@/services/SupabasePomodoroService';
import { useCurrentUser } from '@/hooks/useCurrentUser';

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

export const TaskItemWithPomodoro = ({ 
  task, 
  onToggleTask, 
  onEditTask, 
  onMoveTask, 
  onDeleteTask, 
  onViewDetails, 
  weeklyOutputs = [] 
}: TaskItemProps) => {
  const [taggedUsers, setTaggedUsers] = useState<TaggedUser[]>([]);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const { activeSession, createSession } = usePomodoroSessionManager();
  const { currentUser } = useCurrentUser();
  const linkedOutput = task.weeklyOutputId ? weeklyOutputs.find(output => output.id === task.weeklyOutputId) : null;

  useEffect(() => {
    if (task.taggedUsers && task.taggedUsers.length > 0) {
      fetchTaggedUsers();
    } else {
      setTaggedUsers([]);
    }
  }, [task.taggedUsers]);

  useEffect(() => {
    const fetchPomodoroCount = async () => {
      if (!currentUser?.id) return;
      
      const sessions = await SupabasePomodoroService.getSessionsByTask(task.id, currentUser.id);
      const workSessions = sessions.filter(s => s.session_type === 'work' && !s.interrupted);
      setPomodoroCount(workSessions.length);
    };

    fetchPomodoroCount();
  }, [task.id, currentUser?.id, activeSession]); // Re-fetch when session changes

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

  const isOverdue = () => {
    return task.dueDate && isPast(task.dueDate) && !isToday(task.dueDate) && !task.completed;
  };

  const isActivePomodoro = activeSession?.task_id === task.id;

  const handlePomodoroClick = () => {
    if (task.completed) return;
    // Create session for this specific task
    createSession(task.id, task.title);
  };

  return (
    <ItemCard
      isCompleted={task.completed}
      isOverdue={isOverdue()}
      actions={{
        onView: onViewDetails,
        onDelete: () => onDeleteTask(task.id),
        customActions: (
          <>
            {!task.completed && (
              <IconButton
                icon={<Timer className="h-4 w-4" />}
                onClick={handlePomodoroClick}
                tooltip={isActivePomodoro ? "Pause/Resume Timer" : "Start Pomodoro Timer"}
                variant={isActivePomodoro ? "default" : "outline"}
              />
            )}
            {!task.completed && (
              <MoveTaskDialog 
                onMoveTask={(newDate) => onMoveTask(task.id, newDate)}
              />
            )}
          </>
        )
      }}
      header={
        <div className="flex items-center justify-between w-full">
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
          {pomodoroCount > 0 && !task.completed && (
            <Badge variant="outline" className="gap-1 ml-2">
              <Timer className="h-3 w-3" />
              {pomodoroCount}
            </Badge>
          )}
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
      {task.description && (
        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
      )}
    </ItemCard>
  );
};