import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckSquare, Clock } from 'lucide-react';
import { isTaskOverdue } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { TaskPomodoroStatsService } from '@/services/TaskPomodoroStatsService';

interface UserTaskOwnership {
  userId: string;
  userName: string;
  email: string;
  tasks: Array<{
    taskId: string;
    taskTitle: string;
    priority: 'Low' | 'Medium' | 'High';
    dueDate: Date;
    pomodoroSessions: number;
    totalDuration: number;
  }>;
  totalTasks: number;
}

interface UserTaskOwnershipCardProps {
  ownership: UserTaskOwnership;
  onViewDetails?: (userId: string) => void;
}

const getPriorityColor = (priority: 'Low' | 'Medium' | 'High') => {
  switch (priority) {
    case 'High':
      return 'text-destructive';
    case 'Medium':
      return 'text-yellow-600';
    case 'Low':
      return 'text-muted-foreground';
    default:
      return 'text-muted-foreground';
  }
};

export const UserTaskOwnershipCard = ({ 
  ownership, 
  onViewDetails 
}: UserTaskOwnershipCardProps) => {
  const initials = ownership.userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Only show active tasks
  const activeTasks = ownership.tasks;
  const activeTasksCount = activeTasks.length;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* User Header */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">{ownership.userName}</h3>
            <p className="text-xs text-muted-foreground">{ownership.email}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            <CheckSquare className="h-3 w-3 mr-1" />
            {activeTasksCount} {activeTasksCount === 1 ? 'Task' : 'Tasks'}
          </Badge>
        </div>

        {/* Tasks List */}
        <div className="space-y-2">
          {activeTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No active tasks</p>
          ) : (
            activeTasks.map((task) => {
              const isOverdue = isTaskOverdue(task.dueDate);
              const formattedDuration = TaskPomodoroStatsService.formatDuration(task.totalDuration);
              
              return (
                <div 
                  key={task.taskId} 
                  className={cn(
                    "border-l-2 pl-3 py-1",
                    isOverdue ? "border-destructive" : "border-muted"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        isOverdue ? "text-destructive" : "text-foreground"
                      )}>
                        {task.taskTitle}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={cn("text-xs font-medium", getPriorityColor(task.priority))}>
                          {task.priority}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formattedDuration || '0m'}</span>
                        </div>
                        {isOverdue && (
                          <span className="text-xs text-destructive font-medium">(Overdue)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* View Details Button */}
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(ownership.userId)}
            className="mt-3 w-full text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            View Employee Details →
          </button>
        )}
      </CardContent>
    </Card>
  );
};