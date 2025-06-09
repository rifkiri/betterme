import { useState, useEffect } from 'react';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { Habit, Task, WeeklyOutput } from '@/types/productivity';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export const useProductivityData = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weeklyOutputs, setWeeklyOutputs] = useState<WeeklyOutput[]>([]);
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
  const [deletedWeeklyOutputs, setDeletedWeeklyOutputs] = useState<WeeklyOutput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Get current user ID from Supabase auth
  const getCurrentUserId = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    console.log('Current user:', user?.id);
    return user?.id || null;
  };

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const initializeUser = async () => {
      const currentUserId = await getCurrentUserId();
      console.log('Initialized user ID:', currentUserId);
      setUserId(currentUserId);
    };
    initializeUser();
  }, []);

  // Check if Supabase is available
  const isSupabaseAvailable = () => {
    const available = supabaseDataService.isConfigured() && userId !== null;
    console.log('Supabase available:', available, 'User ID:', userId);
    return available;
  };

  // Load all data from Supabase
  const loadAllData = async (date?: Date) => {
    if (!userId) {
      console.log('No user ID found, cannot load data');
      return;
    }

    const targetDate = date || selectedDate;
    console.log('Loading data for user:', userId, 'date:', format(targetDate, 'yyyy-MM-dd'));
    setIsLoading(true);
    try {
      if (isSupabaseAvailable()) {
        console.log('Loading data from Supabase...');
        const [habitsData, tasksData, weeklyOutputsData] = await Promise.all([
          supabaseDataService.getHabitsForDate(userId, targetDate),
          supabaseDataService.getTasks(userId),
          supabaseDataService.getWeeklyOutputs(userId)
        ]);

        console.log('Loaded habits for date:', habitsData);
        console.log('Loaded tasks:', tasksData);
        console.log('Loaded weekly outputs:', weeklyOutputsData);

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
      console.log('User ID or date changed, loading data:', userId, format(selectedDate, 'yyyy-MM-dd'));
      loadAllData(selectedDate);
    }
  }, [userId, selectedDate]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

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
    selectedDate,
    
    // Utils
    userId,
    isGoogleSheetsAvailable: isSupabaseAvailable, // Keep same interface
    loadAllData,
    handleDateChange,
  };
};
