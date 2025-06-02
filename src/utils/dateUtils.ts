import { format, startOfWeek, endOfWeek, isToday, addDays, isWithinInterval, isPast, isBefore, isAfter } from 'date-fns';

export const getToday = () => new Date();

export const getYesterday = () => addDays(getToday(), -1);

export const getCurrentWeekInterval = () => {
  const today = getToday();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  return { start: weekStart, end: weekEnd };
};

export const isSameDate = (date1: Date, date2: Date) => {
  return format(date1, 'yyyy-MM-dd') === format(date2, 'yyyy-MM-dd');
};

export const isTaskOverdue = (taskDate: Date) => {
  const today = getToday();
  return taskDate < today && !isToday(taskDate);
};

export const isWeeklyOutputOverdue = (dueDate: Date, progress: number = 0, completedDate?: Date) => {
  const today = getToday();
  
  // If not completed yet, check if past due date
  if (progress < 100) {
    return isPast(dueDate) && !isToday(dueDate);
  }
  
  // If completed, check if it was completed after the due date
  if (completedDate) {
    // Use isBefore to check if due date is before completion date (meaning it's overdue)
    // But don't mark as overdue if completed on the same day as due date
    return isAfter(completedDate, dueDate) && !isSameDate(completedDate, dueDate);
  }
  
  // If completed but no completion date recorded, assume not overdue
  return false;
};

export const isTaskWithinWeek = (taskDate: Date) => {
  const { start, end } = getCurrentWeekInterval();
  return isWithinInterval(taskDate, { start, end });
};
