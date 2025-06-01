
import { useProductivity } from './useProductivity';

export const useWeeklyOutputs = () => {
  const productivity = useProductivity();
  
  return {
    weeklyOutputs: productivity.weeklyOutputs,
    deletedWeeklyOutputs: productivity.deletedWeeklyOutputs,
    addWeeklyOutput: productivity.addWeeklyOutput,
    editWeeklyOutput: productivity.editWeeklyOutput,
    updateProgress: productivity.updateProgress,
    moveWeeklyOutput: productivity.moveWeeklyOutput,
    deleteWeeklyOutput: productivity.deleteWeeklyOutput,
    restoreWeeklyOutput: productivity.restoreWeeklyOutput,
    permanentlyDeleteWeeklyOutput: productivity.permanentlyDeleteWeeklyOutput,
    getOverdueWeeklyOutputs: productivity.getOverdueWeeklyOutputs,
  };
};
