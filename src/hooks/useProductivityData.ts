
import { useState, useEffect } from 'react';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { Habit, Task, WeeklyOutput } from '@/types/productivity';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useProductivityData = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weeklyOutputs, setWeeklyOutputs] = useState<WeeklyOutput[]>([]);
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
  const [deletedWeeklyOutputs, setDeletedWeeklyOutputs] = useState<WeeklyOutput[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get current user ID from Supabase auth
  const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  };

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const initializeUser = async () => {
      const currentUserId = await getCurrentUserId();
      setUserId(currentUserId);
    };
    initializeUser();
  }, []);

  // Check if Supabase is available
  const isSupabaseAvailable = () => {
    return supabaseDataService.isConfigured() && userId !== null;
  };

  // Load all data from Supabase
  const loadAllData = async () => {
    if (!userId) {
      console.log('No user ID found, cannot load data');
      return;
    }

    setIsLoading(true);
    try {
      if (isSupabaseAvailable()) {
        console.log('Loading data from Supabase...');
        const [habitsData, tasksData, weeklyOutputsData] = await Promise.all([
          supabaseDataService.getHabits(userId),
          supabaseDataService.getTasks(userId),
          supabaseDataService.getWeeklyOutputs(userId)
        ]);

        setHabits(habitsData.filter(h => !h.archived && !h.isDeleted));
        setArchivedHabits(habitsData.filter(h => h.archived));
        setTasks(tasksData.filter(t => !t.isDeleted));
        setDeletedTasks(tasksData.filter(t => t.isDeleted));
        setWeeklyOutputs(weeklyOutputsData.filter(w => !w.isDeleted));
        setDeletedWeeklyOutputs(weeklyOutputsData.filter(w => w.isDeleted));
        
        console.log('Data loaded from Supabase successfully');
      } else {
        console.log('Supabase not available or user not authenticated');
        toast.error('Please sign in to access your data');
      }
    } catch (error) {
      console.error('Failed to load data from Supabase:', error);
      toast.error('Failed to load data from Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadAllData();
    }
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
    isGoogleSheetsAvailable: isSupabaseAvailable, // Keep same interface
    loadAllData,
  };
};
