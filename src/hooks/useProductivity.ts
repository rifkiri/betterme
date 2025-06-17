
import { useProductivityData } from './useProductivityData';
import { useHabitsManager } from './useHabitsManager';
import { useTasksManager } from './useTasksManager';
import { useWeeklyOutputsManager } from './useWeeklyOutputsManager';
import { useProjectsManager } from './useProjectsManager';
import { useTaskHelpers } from './useTaskHelpers';
import { useWeeklyOutputHelpers } from './useWeeklyOutputHelpers';
import { useProjectHelpers } from './useProjectHelpers';

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

  const projectsManager = useProjectsManager({
    userId: productivityData.userId,
    isSupabaseAvailable: productivityData.isGoogleSheetsAvailable,
    loadAllData: productivityData.loadAllData,
    projects: productivityData.projects,
    setProjects: productivityData.setProjects,
    deletedProjects: productivityData.deletedProjects,
    setDeletedProjects: productivityData.setDeletedProjects,
  });

  const taskHelpers = useTaskHelpers(productivityData.tasks);
  const weeklyOutputHelpers = useWeeklyOutputHelpers(productivityData.weeklyOutputs);
  const projectHelpers = useProjectHelpers(productivityData.projects);

  return {
    // State
    habits: productivityData.habits,
    archivedHabits: productivityData.archivedHabits,
    tasks: productivityData.tasks,
    deletedTasks: productivityData.deletedTasks,
    weeklyOutputs: productivityData.weeklyOutputs,
    deletedWeeklyOutputs: productivityData.deletedWeeklyOutputs,
    projects: productivityData.projects,
    deletedProjects: productivityData.deletedProjects,
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

    // Projects
    ...projectsManager,
    ...projectHelpers,
  };
};
