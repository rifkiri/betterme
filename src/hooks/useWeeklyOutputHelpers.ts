
import { WeeklyOutput } from '@/types/productivity';

export const useWeeklyOutputHelpers = (weeklyOutputs: WeeklyOutput[]) => {
  const getOverdueWeeklyOutputs = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return weeklyOutputs.filter(output => 
      output.dueDate && 
      output.dueDate < today && 
      output.progress < 100 && 
      !output.completedDate
    );
  };

  return {
    getOverdueWeeklyOutputs,
  };
};
