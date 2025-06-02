
import { Task } from '@/types/productivity';
import { isTaskOverdue } from '@/utils/dateUtils';

export const useTaskHelpers = (tasks: Task[]) => {
  // Helper methods for filtering data
  const getTasksByDate = (date: Date) => {
    return tasks.filter(task => 
      task.dueDate && task.dueDate.toDateString() === date.toDateString()
    );
  };

  const getTodaysTasks = () => getTasksByDate(new Date());
  
  const getOverdueTasks = () => {
    return tasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      isTaskOverdue(task.dueDate)
    );
  };

  const getCompletedTasks = () => tasks.filter(task => task.completed);
  const getPendingTasks = () => tasks.filter(task => !task.completed);

  const getCurrentWeekTasks = () => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    return tasks.filter(task => 
      task.dueDate && 
      task.dueDate >= startOfWeek && 
      task.dueDate <= endOfWeek
    );
  };

  return {
    getTasksByDate,
    getTodaysTasks,
    getOverdueTasks,
    getCompletedTasks,
    getPendingTasks,
    getCurrentWeekTasks,
  };
};
