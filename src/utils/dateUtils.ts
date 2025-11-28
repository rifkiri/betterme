
import { format, startOfWeek, endOfWeek, isToday, addDays, addWeeks, subWeeks, isWithinInterval, isPast, isBefore, isAfter, isSameWeek, differenceInDays, differenceInWeeks } from 'date-fns';

export const getToday = () => new Date();

export const getYesterday = () => addDays(getToday(), -1);

export const getCurrentWeekInterval = () => {
  const today = getToday();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
  return { start: weekStart, end: weekEnd };
};

// Bi-weekly (2-week) interval utilities
export const getBiWeeklyInterval = (date: Date) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  // Use a fixed epoch to ensure consistent bi-weekly periods across all users
  const epochStart = new Date(2020, 0, 5); // A Sunday in 2020
  const weeksSinceEpoch = differenceInWeeks(weekStart, epochStart);
  const isEvenPeriod = Math.floor(weeksSinceEpoch / 2) % 2 === 0;
  
  // Bi-weekly period starts from the beginning of the even week
  const biWeekStart = isEvenPeriod ? weekStart : subWeeks(weekStart, 1);
  const biWeekEnd = endOfWeek(addWeeks(biWeekStart, 1), { weekStartsOn: 0 });
  
  return { start: biWeekStart, end: biWeekEnd };
};

export const getCurrentBiWeeklyInterval = () => {
  return getBiWeeklyInterval(getToday());
};

export const isWithinBiWeek = (taskDate: Date, referenceDate: Date) => {
  const { start, end } = getBiWeeklyInterval(referenceDate);
  return isWithinInterval(taskDate, { start, end });
};

export const isSameBiWeek = (date1: Date, date2: Date) => {
  const interval1 = getBiWeeklyInterval(date1);
  const interval2 = getBiWeeklyInterval(date2);
  return interval1.start.getTime() === interval2.start.getTime();
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
  
  // If not completed (progress < 100), check if past due date
  if (progress < 100) {
    const isOverdue = isBefore(dueDate, today) && !isToday(dueDate);
    console.log('Not completed, overdue:', isOverdue);
    return isOverdue;
  }
  
  // If completed (progress = 100), check if it has a completedDate set
  // If no completedDate but progress is 100, assume it was just completed and not overdue
  if (progress === 100 && !completedDate) {
    console.log('Completed but no completion date recorded, assuming just completed - not overdue');
    return false;
  }
  
  // If completed with a completion date, check if it was completed after the due date
  if (progress === 100 && completedDate && createdDate) {
    // Flexible approach: if the output was completed within 7 days of creation, don't mark as overdue
    const daysBetweenCreationAndCompletion = differenceInDays(completedDate, createdDate);
    
    if (daysBetweenCreationAndCompletion <= 7) {
      console.log('Completed within 7 days of creation, not overdue');
      return false;
    }
    
    // Check if completed after due date (but not on the same day)
    const isOverdue = isAfter(completedDate, dueDate) && !isSameDate(completedDate, dueDate);
    console.log('Completed after due date check:', isOverdue);
    return isOverdue;
  }
  
  // Default case: not overdue
  console.log('Default case: not overdue');
  return false;
};

export const isTaskWithinWeek = (taskDate: Date) => {
  const { start, end } = getCurrentWeekInterval();
  return isWithinInterval(taskDate, { start, end });
};
