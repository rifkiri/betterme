import { useProductivityData } from './useProductivityData';
import { useHabitsManager } from './useHabitsManager';
import { useTasksManager } from './useTasksManager';
import { useWeeklyOutputsManager } from './useWeeklyOutputsManager';
import { useGoalsManager } from './useGoalsManager';
import { useGoalCollaboration } from './useGoalCollaboration';
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
    selectedDate: productivityData.selectedDate,
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

  const goalsManager = useGoalsManager({
    userId: productivityData.userId,
    isGoogleSheetsAvailable: productivityData.isGoogleSheetsAvailable,
    loadAllData: productivityData.loadAllData,
    goals: productivityData.goals,
    setGoals: productivityData.setGoals,
    deletedGoals: productivityData.deletedGoals,
    setDeletedGoals: productivityData.setDeletedGoals,
  });

  const goalCollaboration = useGoalCollaboration(productivityData.userId || '', productivityData.loadAllData);

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
    goals: productivityData.goals,
    allGoals: productivityData.allGoals,
    deletedGoals: productivityData.deletedGoals,
    isLoading: productivityData.isLoading,
    selectedDate: productivityData.selectedDate,
    
    // Methods
    loadAllData: productivityData.loadAllData,
    handleDateChange: productivityData.handleDateChange,
    
    // Habits
    ...habitsManager,
    
    // Tasks
    ...tasksManager,
    ...taskHelpers,
    
    // Weekly Outputs
    ...weeklyOutputsManager,
    ...weeklyOutputHelpers,
    
    // Goals
    ...goalsManager,
    ...goalCollaboration,
  };
};
