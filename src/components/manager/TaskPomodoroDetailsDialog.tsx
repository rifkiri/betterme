import React from 'react';
import { BaseDialog } from '@/components/ui/base-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, User, Timer, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { isTaskOverdue } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { TaskPomodoroStatsService } from '@/services/TaskPomodoroStatsService';

interface TaskPomodoroDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: string;
    title: string;
    priority: 'Low' | 'Medium' | 'High';
    dueDate: Date;
    userName: string;
    pomodoroSessions: number;
    totalDuration: number;
  } | null;
}

const getPriorityVariant = (priority: 'Low' | 'Medium' | 'High') => {
  switch (priority) {
    case 'High':
      return 'destructive';
    case 'Medium':
      return 'secondary';
    case 'Low':
      return 'outline';
    default:
      return 'outline';
  }
};

export const TaskPomodoroDetailsDialog = ({
  open,
  onOpenChange,
  task
}: TaskPomodoroDetailsDialogProps) => {
  if (!task) return null;
  
  const isOverdue = isTaskOverdue(task.dueDate);
  const formattedDuration = TaskPomodoroStatsService.formatDuration(task.totalDuration);

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Task Details"
      description={task.title}
      headerIcon={<Timer className="h-5 w-5 text-primary" />}
      maxWidth="md"
    >
      <ScrollArea className="max-h-[60vh]">
        <Card className={cn(
          "overflow-hidden",
          isOverdue && "border-destructive/50 bg-destructive/5"
        )}>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Task Title and Priority */}
              <div className="flex items-start justify-between gap-2">
                <h4 className={cn(
                  "font-medium leading-tight",
                  isOverdue && "text-destructive"
                )}>
                  {task.title}
                </h4>
                <Badge variant={getPriorityVariant(task.priority)} className="text-xs flex-shrink-0">
                  {task.priority}
                </Badge>
              </div>
              
              {/* Owner and Due Date */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>Owner: {task.userName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className={cn(
                    "h-3.5 w-3.5",
                    isOverdue && "text-destructive"
                  )} />
                  <span className={cn(isOverdue && "text-destructive font-medium")}>
                    Due: {format(task.dueDate, 'MMM d, yyyy')}
                  </span>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs ml-1">
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>

              {/* Pomodoro Stats */}
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <Timer className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pomodoro Sessions</p>
                    <p className="text-lg font-semibold text-foreground">{task.pomodoroSessions}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Duration</p>
                    <p className="text-lg font-semibold text-foreground">{formattedDuration || '0m'}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </ScrollArea>
    </BaseDialog>
  );
};