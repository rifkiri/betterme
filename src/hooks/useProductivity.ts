
import { useProductivityData } from './useProductivityData';
import { useHabitsManager } from './useHabitsManager';
import { useTasksManager } from './useTasksManager';
import { useWeeklyOutputsManager } from './useWeeklyOutputsManager';
import { useTaskHelpers } from './useTaskHelpers';
import { useWeeklyOutputHelpers } from './useWeeklyOutputHelpers';

export const useProductivity = () => {
  const productivityData = useProductivityData();
  
  const habitsManager = useHabitsManager({
    userId: productivityData.userId,
    isGoogleSheetsAvailable: productivityData.isGoogleSheetsAvailable,
    loadAllData: productivityData.loadAllData,
    habits: productivityData.habits,
    setHabits: productivityData.setHabits,
    archivedHabits: productivityData.archivedHabits,
    setArchivedHabits: productivityData.setArchivedHabits,
  });

  const tasksManager = useTasksManager({
    userId: productivityData.userId,
    isGoogleSheetsAvailable: productivityData.isGoogleSheetsAvailable,
    loadAllData: productivityData.loadAllData,
    tasks: productivityData.tasks,
    setTasks: productivityData.setTasks,
    deletedTasks: productivityData.deletedTasks,
    setDeletedTasks: productivityData.setDeletedTasks,
  });

  const weeklyOutputsManager = useWeeklyOutputsManager({
    userId: productivityData.userId,
    isGoogleSheetsAvailable: productivityData.isGoogleSheetsAvailable,
    loadAllData: productivityData.loadAllData,
    weeklyOutputs: productivityData.weeklyOutputs,
    setWeeklyOutputs: productivityData.setWeeklyOutputs,
    deletedWeeklyOutputs: productivityData.deletedWeeklyOutputs,
    setDeletedWeeklyOutputs: productivityData.setDeletedWeeklyOutputs,
  });

  const taskHelpers = useTaskHelpers(productivityData.tasks);
  const weeklyOutputHelpers = useWeeklyOutputHelpers(productivityData.weeklyOutputs);

  return {
    // State
    habits: productivityData.habits,
    archivedHabits: productivityData.archivedHabits,
    tasks: productivityData.tasks,
    deletedTasks: productivityData.deletedTasks,
    weeklyOutputs: productivityData.weeklyOutputs,
    deletedWeeklyOutputs: productivityData.deletedWeeklyOutputs,
    isLoading: productivityData.isLoading,
    
    // Methods
    loadAllData: productivityData.loadAllData,
    
    // Habits
    ...habitsManager,
    
    // Tasks
    ...tasksManager,
    ...taskHelpers,
    
    // Weekly Outputs
    ...weeklyOutputsManager,
    ...weeklyOutputHelpers,
  };
};
