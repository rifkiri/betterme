import { useProductivity } from './useProductivity';

export const useGoals = () => {
  const productivity = useProductivity();
  
  return {
    goals: productivity.goals,
    deletedGoals: productivity.deletedGoals,
    addGoal: productivity.addGoal,
    editGoal: productivity.editGoal,
    updateGoalProgress: productivity.updateGoalProgress,
    moveGoal: productivity.moveGoal,
    deleteGoal: productivity.deleteGoal,
    restoreGoal: productivity.restoreGoal,
    permanentlyDeleteGoal: productivity.permanentlyDeleteGoal,
    getOverdueGoals: productivity.getOverdueGoals,
  };
};