import { useEffect } from 'react';
import { useDataStore } from '@/stores/dataStore';
import { useAuth } from './useAuth';
import { DataService } from '@/services/DataService';
import { toast } from 'sonner';

export const useData = () => {
  const { userId } = useAuth();
  const {
    goals,
    tasks,
    weeklyOutputs,
    habits,
    selectedDate,
    isLoading,
    setSelectedDate,
    loadAllData,
    addGoal,
    updateGoal,
    removeGoal,
    addTask,
    updateTask,
    removeTask,
    addWeeklyOutput,
    updateWeeklyOutput,
    removeWeeklyOutput,
    addHabit,
    updateHabit,
    removeHabit,
  } = useDataStore();

  useEffect(() => {
    if (userId) {
      loadAllData(userId);
    }
  }, [userId, selectedDate, loadAllData]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // Goal operations with optimistic updates
  const createGoal = async (goalData: any) => {
    if (!userId) return;
    
    try {
      const newGoal = await DataService.createGoal({ ...goalData, user_id: userId });
      addGoal(newGoal);
      toast.success('Goal created successfully');
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal');
    }
  };

  const editGoal = async (id: string, updates: any) => {
    try {
      const updatedGoal = await DataService.updateGoal(id, updates);
      updateGoal(id, updatedGoal);
      toast.success('Goal updated successfully');
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await DataService.deleteGoal(id);
      removeGoal(id);
      toast.success('Goal deleted successfully');
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  // Task operations with optimistic updates
  const createTask = async (taskData: any) => {
    if (!userId) return;
    
    try {
      const newTask = await DataService.createTask({ ...taskData, user_id: userId });
      addTask(newTask);
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const editTask = async (id: string, updates: any) => {
    try {
      const updatedTask = await DataService.updateTask(id, updates);
      updateTask(id, updatedTask);
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await DataService.deleteTask(id);
      removeTask(id);
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  // Weekly Output operations
  const createWeeklyOutput = async (outputData: any) => {
    if (!userId) return;
    
    try {
      const newOutput = await DataService.createWeeklyOutput({ ...outputData, user_id: userId });
      addWeeklyOutput(newOutput);
      toast.success('Weekly output created successfully');
    } catch (error) {
      console.error('Error creating weekly output:', error);
      toast.error('Failed to create weekly output');
    }
  };

  const editWeeklyOutput = async (id: string, updates: any) => {
    try {
      const updatedOutput = await DataService.updateWeeklyOutput(id, updates);
      updateWeeklyOutput(id, updatedOutput);
      toast.success('Weekly output updated successfully');
    } catch (error) {
      console.error('Error updating weekly output:', error);
      toast.error('Failed to update weekly output');
    }
  };

  const deleteWeeklyOutput = async (id: string) => {
    try {
      await DataService.deleteWeeklyOutput(id);
      removeWeeklyOutput(id);
      toast.success('Weekly output deleted successfully');
    } catch (error) {
      console.error('Error deleting weekly output:', error);
      toast.error('Failed to delete weekly output');
    }
  };

  // Habit operations
  const createHabit = async (habitData: any) => {
    if (!userId) return;
    
    try {
      const newHabit = await DataService.createHabit({ ...habitData, user_id: userId });
      addHabit(newHabit);
      toast.success('Habit created successfully');
    } catch (error) {
      console.error('Error creating habit:', error);
      toast.error('Failed to create habit');
    }
  };

  const editHabit = async (id: string, updates: any) => {
    try {
      const updatedHabit = await DataService.updateHabit(id, updates);
      updateHabit(id, updatedHabit);
      toast.success('Habit updated successfully');
    } catch (error) {
      console.error('Error updating habit:', error);
      toast.error('Failed to update habit');
    }
  };

  const deleteHabit = async (id: string) => {
    try {
      await DataService.deleteHabit(id);
      removeHabit(id);
      toast.success('Habit deleted successfully');
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast.error('Failed to delete habit');
    }
  };

  return {
    // State
    goals,
    tasks,
    weeklyOutputs,
    habits,
    selectedDate,
    isLoading,
    
    // Actions
    handleDateChange,
    loadAllData: () => userId && loadAllData(userId),
    
    // Goal operations
    createGoal,
    editGoal,
    deleteGoal,
    
    // Task operations
    createTask,
    editTask,
    deleteTask,
    
    // Weekly output operations
    createWeeklyOutput,
    editWeeklyOutput,
    deleteWeeklyOutput,
    
    // Habit operations
    createHabit,
    editHabit,
    deleteHabit,
  };
};