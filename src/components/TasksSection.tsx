
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, isToday, isSameDay } from 'date-fns';
import { Task, WeeklyOutput, Goal } from '@/types/productivity';
import { AddTaskDialog } from './AddTaskDialog';
import { TaskItem } from './TaskItem';
import { DeletedTasksDialog } from './DeletedTasksDialog';
import { TaskDetailsDialog } from './TaskDetailsDialog';

interface TasksSectionProps {
  tasks: Task[];
  deletedTasks: Task[];
  overdueTasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'createdDate' | 'isMoved'>) => void;
  onEditTask: (id: string, updates: Partial<Task>) => void;
  onToggleTask: (id: string) => void;
  onMoveTask: (taskId: string, targetDate: Date) => void;
  onDeleteTask: (id: string) => void;
  onRestoreTask: (id: string) => void;
  onPermanentlyDeleteTask: (id: string) => void;
  getTasksByDate: (date: Date) => Task[];
  weeklyOutputs?: WeeklyOutput[];
  goals?: Goal[];
}

export const TasksSection = ({ 
  tasks, 
  deletedTasks,
  overdueTasks, 
  onAddTask, 
  onEditTask,
  onToggleTask, 
  onMoveTask, 
  onDeleteTask,
  onRestoreTask,
  onPermanentlyDeleteTask,
  getTasksByDate,
  weeklyOutputs = [],
  goals = []
}: TasksSectionProps) => {
  const [selectedTaskDate, setSelectedTaskDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Enhanced task filtering for selected date
  const getTasksForSelectedDate = (date: Date) => {
    return tasks.filter(task => {
      // Show tasks due on this date
      if (task.dueDate && isSameDay(task.dueDate, date)) {
        return true;
      }
      
      // Show completed tasks that were completed on this date (even if they were overdue)
      if (task.completed && task.completedDate && isSameDay(task.completedDate, date)) {
        return true;
      }
      
      return false;
    });
  };
  
  const selectedDateTasks = getTasksForSelectedDate(selectedTaskDate);
  const today = new Date();

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedTaskDate(prev => addDays(prev, direction === 'next' ? 1 : -1));
  };

  const goToToday = () => {
    setSelectedTaskDate(new Date());
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg">Tasks</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {isToday(selectedTaskDate) ? 'Today' : format(selectedTaskDate, 'MMM dd, yyyy')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <DeletedTasksDialog 
              deletedTasks={deletedTasks}
              onRestoreTask={onRestoreTask}
              onPermanentlyDeleteTask={onPermanentlyDeleteTask}
            />
            <AddTaskDialog 
              onAddTask={(task) => onAddTask({ ...task, dueDate: selectedTaskDate, originalDueDate: selectedTaskDate })} 
              weeklyOutputs={weeklyOutputs}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3">
        {/* Date Navigation - Mobile optimized */}
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigateDate('prev')}
            className="flex items-center gap-1 h-8 px-2 text-xs"
          >
            <ChevronLeft className="h-3 w-3" />
            <span className="hidden xs:inline">Prev</span>
          </Button>
          
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
            <span className="text-xs sm:text-sm font-medium truncate">
              {format(selectedTaskDate, 'EEE, MMM dd')}
            </span>
            {!isToday(selectedTaskDate) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={goToToday}
                className="text-xs h-6 px-2 shrink-0"
              >
                Today
              </Button>
            )}
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigateDate('next')}
            className="flex items-center gap-1 h-8 px-2 text-xs"
          >
            <span className="hidden xs:inline">Next</span>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        {/* Tasks for Selected Date */}
        <div className="space-y-2">
          {selectedDateTasks.length === 0 ? (
            <p className="text-center text-gray-500 py-4 text-sm">No tasks for this date</p>
          ) : (
            selectedDateTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task}
                onToggleTask={onToggleTask}
                onEditTask={onEditTask}
                onMoveTask={onMoveTask}
                onDeleteTask={onDeleteTask}
                onViewDetails={() => setSelectedTask(task)}
                weeklyOutputs={weeklyOutputs}
              />
            ))
          )}
        </div>
        
        {/* Show overdue tasks only when viewing today and they haven't been completed */}
        {isToday(selectedTaskDate) && overdueTasks.filter(task => !task.completed).length > 0 && (
          <div className="border-t pt-2 sm:pt-3 mt-2 sm:mt-3">
            <h4 className="text-sm font-medium text-orange-600 mb-2">Overdue Tasks</h4>
            <div className="space-y-2">
              {overdueTasks.filter(task => !task.completed).slice(0, 3).map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task}
                  onToggleTask={onToggleTask}
                  onEditTask={onEditTask}
                  onMoveTask={onMoveTask}
                  onDeleteTask={onDeleteTask}
                  onViewDetails={() => setSelectedTask(task)}
                  weeklyOutputs={weeklyOutputs}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Task Details Dialog */}
      <TaskDetailsDialog
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        onEditTask={onEditTask}
        onToggleTask={onToggleTask}
        weeklyOutputs={weeklyOutputs}
        goals={goals}
      />
    </Card>
  );
};
