
import { WeeklyOutput } from '@/types/productivity';
import { isWeeklyOutputOverdue } from '@/utils/dateUtils';

export const useWeeklyOutputHelpers = (weeklyOutputs: WeeklyOutput[]) => {
  const getOverdueWeeklyOutputs = () => {
    return weeklyOutputs.filter(output => {
      // Only consider outputs with due dates
      if (!output.dueDate) return false;
      
      // Check if the output is overdue based on current progress and completion status
      const isOverdue = isWeeklyOutputOverdue(output.dueDate, output.progress, output.completedDate, output.createdDate);
      
      console.log('Output overdue check:', {
        title: output.title,
        progress: output.progress,
        isOverdue
      });
      
      return isOverdue;
    });
  };

  return {
    getOverdueWeeklyOutputs,
  };
};
