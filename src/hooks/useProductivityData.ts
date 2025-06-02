
import { useState, useEffect } from 'react';
import { googleSheetsService } from '@/services/GoogleSheetsService';
import { Habit, Task, WeeklyOutput } from '@/types/productivity';
import { toast } from 'sonner';

export const useProductivityData = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weeklyOutputs, setWeeklyOutputs] = useState<WeeklyOutput[]>([]);
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
  const [deletedWeeklyOutputs, setDeletedWeeklyOutputs] = useState<WeeklyOutput[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    const authUser = localStorage.getItem('authUser');
    return authUser ? JSON.parse(authUser).id : null;
  };

  const userId = getCurrentUserId();

  // Check if Google Sheets is available
  const isGoogleSheetsAvailable = () => {
    return googleSheetsService.isConfigured() && googleSheetsService.isAuthenticated();
  };

  // Load all data from Google Sheets
  const loadAllData = async () => {
    if (!userId) {
      return;
    }

    setIsLoading(true);
    try {
      if (isGoogleSheetsAvailable()) {
        console.log('Loading data from Google Sheets...');
        const [habitsData, tasksData, weeklyOutputsData] = await Promise.all([
          googleSheetsService.getHabits(userId),
          googleSheetsService.getTasks(userId),
          googleSheetsService.getWeeklyOutputs(userId)
        ]);

        setHabits(habitsData.filter(h => !h.archived && !h.isDeleted));
        setArchivedHabits(habitsData.filter(h => h.archived));
        setTasks(tasksData.filter(t => !t.isDeleted));
        setDeletedTasks(tasksData.filter(t => t.isDeleted));
        setWeeklyOutputs(weeklyOutputsData.filter(w => !w.isDeleted));
        setDeletedWeeklyOutputs(weeklyOutputsData.filter(w => w.isDeleted));
        
        console.log('Data loaded from Google Sheets successfully');
      } else {
        console.log('Google Sheets not available, data will be empty');
        toast.error('Google Sheets not configured. Please configure in Settings.');
      }
    } catch (error) {
      console.error('Failed to load data from Google Sheets:', error);
      toast.error('Failed to load data from Google Sheets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [userId]);

  return {
    // State
    habits,
    setHabits,
    tasks,
    setTasks,
    weeklyOutputs,
    setWeeklyOutputs,
    archivedHabits,
    setArchivedHabits,
    deletedTasks,
    setDeletedTasks,
    deletedWeeklyOutputs,
    setDeletedWeeklyOutputs,
    isLoading,
    
    // Utils
    userId,
    isGoogleSheetsAvailable,
    loadAllData,
  };
};
