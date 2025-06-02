
import { WeeklyOutput } from '@/types/productivity';
import { isWeeklyOutputOverdue } from '@/utils/dateUtils';

export const useWeeklyOutputHelpers = (weeklyOutputs: WeeklyOutput[]) => {
  const getOverdueWeeklyOutputs = () => {
    return weeklyOutputs.filter(output => 
      output.dueDate && 
      isWeeklyOutputOverdue(output.dueDate, output.progress, output.completedDate) && 
      !output.completedDate
    );
  };

  return {
    getOverdueWeeklyOutputs,
  };
};
