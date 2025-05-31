
import { useHabits } from './useHabits';
import { useTasks } from './useTasks';
import { useWeeklyPlans } from './useWeeklyPlans';
import { useWeeklyOutputs } from './useWeeklyOutputs';

export const useProductivity = () => {
  const habitsHook = useHabits();
  const tasksHook = useTasks();
  const weeklyPlansHook = useWeeklyPlans();
  const weeklyOutputsHook = useWeeklyOutputs();

  return {
    ...habitsHook,
    ...tasksHook,
    ...weeklyPlansHook,
    ...weeklyOutputsHook,
  };
};
