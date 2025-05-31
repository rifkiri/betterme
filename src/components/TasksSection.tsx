
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, isToday } from 'date-fns';
import { Task, WeeklyOutput } from '@/types/productivity';
import { AddTaskDialog } from './AddTaskDialog';
import { TaskItem } from './TaskItem';
import { DeletedTasksDialog } from './DeletedTasksDialog';

interface TasksSectionProps {
  tasks: Task[];
  deletedTasks: Task[];
  overdueTasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'createdDate'>) => void;
  onEditTask: (id: string, updates: Partial<Task>) => void;
  onToggleTask: (id: string) => void;
  onMoveTask: (taskId: string, targetDate: Date) => void;
  onDeleteTask: (id: string) => void;
  onRestoreTask: (id: string) => void;
  onPermanentlyDeleteTask: (id: string) => void;
  getTasksByDate: (date: Date) => Task[];
  weeklyOutputs?: WeeklyOutput[];
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
  weeklyOutputs = []
}: TasksSectionProps) => {
  const [selectedTaskDate, setSelectedTaskDate] = useState(new Date());
  const selectedDateTasks = getTasksByDate(selectedTaskDate);
  const today = new Date();

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedTaskDate(prev => addDays(prev, direction === 'next' ? 1 : -1));
  };

  const goToToday = () => {
    setSelectedTaskDate(new Date());
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>
            {isToday(selectedTaskDate) ? 'Today' : format(selectedTaskDate, 'MMM dd, yyyy')}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <DeletedTasksDialog 
            deletedTasks={deletedTasks}
            onRestoreTask={onRestoreTask}
            onPermanentlyDeleteTask={onPermanentlyDeleteTask}
          />
          <AddTaskDialog 
            onAddTask={(task) => onAddTask({ ...task, dueDate: selectedTaskDate })} 
            weeklyOutputs={weeklyOutputs}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigateDate('prev')}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">
              {format(selectedTaskDate, 'EEE, MMM dd')}
            </span>
            {!isToday(selectedTaskDate) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={goToToday}
                className="text-xs"
              >
                Today
              </Button>
            )}
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigateDate('next')}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Tasks for Selected Date */}
        {selectedDateTasks.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No tasks for this date</p>
        ) : (
          selectedDateTasks.map(task => (
            <TaskItem 
              key={task.id} 
              task={task}
              onToggleTask={onToggleTask}
              onEditTask={onEditTask}
              onMoveTask={onMoveTask}
              onDeleteTask={onDeleteTask}
              weeklyOutputs={weeklyOutputs}
            />
          ))
        )}
        
        {/* Show overdue tasks only when viewing today */}
        {isToday(selectedTaskDate) && overdueTasks.length > 0 && (
          <>
            <div className="border-t pt-3 mt-3">
              <h4 className="text-sm font-medium text-orange-600 mb-2">Overdue Tasks</h4>
              {overdueTasks.slice(0, 3).map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task}
                  onToggleTask={onToggleTask}
                  onEditTask={onEditTask}
                  onMoveTask={onMoveTask}
                  onDeleteTask={onDeleteTask}
                  weeklyOutputs={weeklyOutputs}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
