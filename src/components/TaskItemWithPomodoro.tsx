import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Users, 
  Timer,
  Clock,
  X,
  Target,
  Settings,
  Play,
  Pause,
  Square,
  SkipForward
} from 'lucide-react';
import { Task, WeeklyOutput } from '@/types/productivity';
import { MoveTaskDialog } from './MoveTaskDialog';
import { EditTaskDialog } from './EditTaskDialog';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { ItemCard, StatusBadge, LinkBadge, DateDisplay } from '@/components/ui/standardized';
import { IconButton } from '@/components/ui/icon-button';
import { usePomodoroSessionManager } from '@/hooks/usePomodoroSessionManager';
import { usePomodoroCounter } from '@/hooks/usePomodoroCounter';
import { TaskPomodoroStatsService } from '@/services/TaskPomodoroStatsService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PomodoroSettings } from './pomodoro/PomodoroSettings';
import { getSessionStartAction, getStartButtonTooltip } from '@/utils/pomodoroSessionHelpers';

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
  // Component state
  const [taggedUsers, setTaggedUsers] = useState<TaggedUser[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Hooks
  const { 
    activeSession, 
    createSession, 
    settings,
    isRunning,
    timeRemaining,
    startWork,
    startBreak,
    togglePause,
    resumeWork,
    stopSession,
    skipSession,
    updateSessionSettings,
    terminateSession
  } = usePomodoroSessionManager();
  const { currentUser } = useCurrentUser();
  const { cumulativeCount: pomodoroCount, totalDuration } = usePomodoroCounter(task.id);
  const linkedOutput = task.weeklyOutputId ? weeklyOutputs.find(output => output.id === task.weeklyOutputId) : null;

  useEffect(() => {
    if (task.taggedUsers && task.taggedUsers.length > 0) {
      fetchTaggedUsers();
    } else {
      setTaggedUsers([]);
    }
  }, [task.taggedUsers]);


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

  const handlePomodoroClick = async () => {
    if (task.completed) return;
    // Create session for this specific task
    await createSession(task.id, task.title);
  };

  // Show card timer if there's an active session for this task
  const showCardTimer = activeSession?.task_id === task.id && activeSession?.is_card_visible;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentSessionDuration = () => {
    if (!activeSession) return 25;
    switch (activeSession.current_session_type) {
      case 'work':
        return settings.workDuration;
      case 'short_break':
        return settings.shortBreakDuration;
      case 'long_break':
        return settings.longBreakDuration;
      default:
        return 25;
    }
  };

  const totalSeconds = getCurrentSessionDuration() * 60;
  const progressPercentage = totalSeconds > 0 ? ((totalSeconds - timeRemaining) / totalSeconds) * 100 : 0;

  const getSessionIcon = () => {
    if (!activeSession) return <Clock className="h-4 w-4" />;
    switch (activeSession.current_session_type) {
      case 'work':
        return <Target className="h-4 w-4" />;
      case 'short_break':
      case 'long_break':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getSessionLabel = () => {
    if (!activeSession) return 'Session';
    switch (activeSession.current_session_type) {
      case 'work':
        return 'Work Session';
      case 'short_break':
        return 'Short Break';
      case 'long_break':
        return 'Long Break';
      default:
        return 'Session';
    }
  };

  return (
    <ItemCard
      data-task-id={task.id}
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
              <span>{pomodoroCount}</span>
              {totalDuration > 0 && (
                <span className="text-xs opacity-60">
                  ({TaskPomodoroStatsService.formatDuration(totalDuration)})
                </span>
              )}
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
      {/* Integrated Pomodoro Timer */}
      {showCardTimer && (
        <div className="mt-3 rounded-lg bg-muted/30 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getSessionIcon()}
              <span className="font-semibold text-sm">{getSessionLabel()}</span>
            </div>
            <StatusBadge status={
              activeSession?.session_status === 'active-running' ? 'high' : 
              activeSession?.session_status === 'active-paused' ? 'medium' : 'low'
            }>
              {activeSession?.session_status === 'active-running' ? 'Active' : 
               activeSession?.session_status === 'active-paused' ? 'Paused' : 'Stopped'}
            </StatusBadge>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Working on: <span className="font-medium text-foreground">{task.title}</span>
          </div>
          
          <div className="space-y-3">
            <div className="text-4xl font-bold text-center tracking-tight">
              {formatTime(timeRemaining)}
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="flex justify-center gap-2">
            <IconButton
              icon={isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              onClick={getSessionStartAction(activeSession, isRunning, {
                startWork,
                startBreak,
                resumeWork,
                togglePause
              })}
              tooltip={getStartButtonTooltip(activeSession, isRunning)}
              variant={isRunning ? "default" : "outline"}
            />
            
            <IconButton
              icon={<SkipForward className="h-4 w-4" />}
              onClick={skipSession}
              tooltip="Skip to next"
              variant="outline"
            />
            
            <IconButton
              icon={<Square className="h-4 w-4" />}
              onClick={stopSession}
              tooltip="Stop session"
              variant="outline"
            />
            
            <IconButton
              icon={<Settings className="h-4 w-4" />}
              onClick={() => setSettingsOpen(true)}
              tooltip="Timer settings"
              variant="outline"
            />
            
            <IconButton
              icon={<X className="h-4 w-4" />}
              onClick={terminateSession}
              tooltip="Terminate session"
              colorScheme="destructive"
              variant="outline"
            />
          </div>
        </div>
      )}
      
      {task.description && (
        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
      )}
      
      <PomodoroSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={updateSessionSettings}
      />
    </ItemCard>
  );
};