
import { useProductivity } from './useProductivity';

export const useHabits = () => {
  const productivity = useProductivity();
  
  return {
    habits: productivity.habits,
    archivedHabits: productivity.archivedHabits,
    addHabit: productivity.addHabit,
    editHabit: productivity.editHabit,
    toggleHabit: productivity.toggleHabit,
    archiveHabit: productivity.archiveHabit,
    restoreHabit: productivity.restoreHabit,
    permanentlyDeleteHabit: productivity.permanentlyDeleteHabit,
  };
};
