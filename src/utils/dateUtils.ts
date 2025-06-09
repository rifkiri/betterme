
import { format, startOfWeek, endOfWeek, isToday, addDays, isWithinInterval, isPast, isBefore, isAfter, isSameWeek } from 'date-fns';

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
  // Only consider overdue if the date is before today (not including today)
  return isBefore(taskDate, today) && !isToday(taskDate);
};

export const isWeeklyOutputOverdue = (dueDate: Date, progress: number = 0, completedDate?: Date, createdDate?: Date) => {
  const today = getToday();
  
  console.log('Checking overdue status:', { 
    dueDate: format(dueDate, 'yyyy-MM-dd'), 
    progress, 
    completedDate: completedDate ? format(completedDate, 'yyyy-MM-dd') : 'none',
    createdDate: createdDate ? format(createdDate, 'yyyy-MM-dd') : 'none'
  });
  
  // If not completed yet, check if past due date (but not including today)
  if (progress < 100) {
    const isOverdue = isBefore(dueDate, today) && !isToday(dueDate);
    console.log('Not completed, overdue:', isOverdue);
    return isOverdue;
  }
  
  // If completed, check if it was completed after the due date
  if (completedDate) {
    // Special case: if the output was completed in the same week it was created,
    // don't mark it as overdue (provides flexibility for users who forgot to mark it)
    if (createdDate && isSameWeek(completedDate, createdDate, { weekStartsOn: 1 })) {
      console.log('Completed in same week as created, not overdue');
      return false;
    }
    
    // Use isBefore to check if due date is before completion date (meaning it's overdue)
    // But don't mark as overdue if completed on the same day as due date
    const isOverdue = isAfter(completedDate, dueDate) && !isSameDate(completedDate, dueDate);
    console.log('Completed after due date check:', isOverdue);
    return isOverdue;
  }
  
  // If completed but no completion date recorded, assume not overdue
  console.log('Completed but no completion date, not overdue');
  return false;
};

export const isTaskWithinWeek = (taskDate: Date) => {
  const { start, end } = getCurrentWeekInterval();
  return isWithinInterval(taskDate, { start, end });
};
