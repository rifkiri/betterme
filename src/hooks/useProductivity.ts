
import { useHabits } from './useHabits';
import { useTasks } from './useTasks';
import { useWeeklyPlans } from './useWeeklyPlans';

export const useProductivity = () => {
  const habitsHook = useHabits();
  const tasksHook = useTasks();
  const weeklyPlansHook = useWeeklyPlans();

  return {
    ...habitsHook,
    ...tasksHook,
    ...weeklyPlansHook,
  };
};
