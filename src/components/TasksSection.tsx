
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, isToday, isSameDay } from 'date-fns';
import { Task, WeeklyOutput, Goal } from '@/types/productivity';
import { AddTaskDialog } from './AddTaskDialog';
import { TaskItemWithPomodoro } from './TaskItemWithPomodoro';
import { DeletedTasksDialog } from './DeletedTasksDialog';
import { CompletedTasksDialog } from './CompletedTasksDialog';
import { TaskDetailsDialog } from './TaskDetailsDialog';
import { DateNavigator } from './DateNavigator';

interface TasksSectionProps {
  tasks: Task[];
  deletedTasks: Task[];
  overdueTasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'createdDate' | 'isMoved'>) => void;
  onEditTask: (id: string, updates: Partial<Task>) => Promise<void>;
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
  
  // Keep selectedTask synchronized with the latest task data
  useEffect(() => {
    if (selectedTask) {
      const updatedTask = tasks.find(task => task.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks, selectedTask?.id]);
  
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

  return (
    <Card className="h-fit">
      <CardHeader className="space-y-4 pb-2 sm:pb-4">
        <div>
          <CardTitle className="text-base sm:text-lg">Tasks</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {isToday(selectedTaskDate) ? 'Today' : format(selectedTaskDate, 'MMM dd, yyyy')}
          </CardDescription>
        </div>
        <div className="space-y-2">
          {/* First row: Deleted and Add Task */}
          <div className="flex items-center gap-2">
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
          
          {/* Second row: Completed */}
          <div className="flex items-center">
            <CompletedTasksDialog tasks={tasks} onToggleTask={onToggleTask} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3">
        {/* Date Navigation */}
        <DateNavigator 
          selectedDate={selectedTaskDate} 
          onDateChange={setSelectedTaskDate} 
        />

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
            <TaskItemWithPomodoro
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
