
import { useProductivity } from './useProductivity';

export const useTasks = () => {
  const productivity = useProductivity();
  
  return {
    tasks: productivity.tasks,
    deletedTasks: productivity.deletedTasks,
    addTask: productivity.addTask,
    editTask: productivity.editTask,
    toggleTask: productivity.toggleTask,
    deleteTask: productivity.deleteTask,
    restoreTask: productivity.restoreTask,
    permanentlyDeleteTask: productivity.permanentlyDeleteTask,
    rollOverTask: productivity.rollOverTask,
    getTasksByDate: productivity.getTasksByDate,
    getTodaysTasks: productivity.getTodaysTasks,
    getOverdueTasks: productivity.getOverdueTasks,
    getCompletedTasks: productivity.getCompletedTasks,
    getPendingTasks: productivity.getPendingTasks,
    getCurrentWeekTasks: productivity.getCurrentWeekTasks,
  };
};
