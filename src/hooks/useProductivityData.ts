import { useState, useEffect } from 'react';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { Habit, Task, WeeklyOutput, Goal } from '@/types/productivity';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

export const useProductivityData = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weeklyOutputs, setWeeklyOutputs] = useState<WeeklyOutput[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
  const [deletedWeeklyOutputs, setDeletedWeeklyOutputs] = useState<WeeklyOutput[]>([]);
  const [deletedGoals, setDeletedGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { user } = useAuth();
  const userId = user?.id || null;

  // Check if Supabase is available
  const isSupabaseAvailable = () => {
    const available = supabaseDataService.isConfigured() && userId !== null;
    console.log('Supabase available for user:', userId, 'available:', available);
    return available;
  };

  // Load all data from Supabase
  const loadAllData = async (date?: Date) => {
    if (!userId) {
      console.log('No user ID found, cannot load data');
      return;
    }

    const targetDate = date || selectedDate;
    console.log('Loading productivity data for user:', userId, 'date:', format(targetDate, 'yyyy-MM-dd'));
    setIsLoading(true);
    try {
      if (isSupabaseAvailable()) {
        console.log('Loading data from Supabase for authenticated user...');
        
        // Load habits for the specific date and user
        const [habitsData, tasksData, weeklyOutputsData, goalsData, allGoalsData] = await Promise.all([
          supabaseDataService.getHabitsForDate(userId, targetDate),
          supabaseDataService.getTasks(userId),
          supabaseDataService.getWeeklyOutputs(userId),
          supabaseDataService.getGoals(userId),
          supabaseDataService.getAllGoals()
        ]);

        console.log('Loaded habits for user', userId, 'date:', format(targetDate, 'yyyy-MM-dd'), habitsData);
        console.log('Loaded tasks for user', userId, ':', tasksData);
        console.log('Loaded weekly outputs for user', userId, ':', weeklyOutputsData);
        console.log('Loaded goals for user', userId, ':', goalsData);
        console.log('Loaded all goals:', allGoalsData);

        // Filter and set data ensuring user isolation
        setHabits(habitsData.filter(h => !h.archived && !h.isDeleted));
        setArchivedHabits(habitsData.filter(h => h.archived));
        setTasks(tasksData.filter(t => !t.isDeleted));
        setDeletedTasks(tasksData.filter(t => t.isDeleted));
        setWeeklyOutputs(weeklyOutputsData.filter(w => !w.isDeleted));
        setDeletedWeeklyOutputs(weeklyOutputsData.filter(w => w.isDeleted));
        setGoals(goalsData.filter(g => !g.archived));
        setDeletedGoals(goalsData.filter(g => g.archived));
        setAllGoals(allGoalsData.filter(g => !g.archived));
        
        console.log('Data loaded successfully for user:', userId);
      } else {
        console.log('Supabase not available or user not authenticated');
        toast.error('Please sign in to access your data');
      }
    } catch (error) {
      console.error('Failed to load data from Supabase for user', userId, ':', error);
      toast.error('Failed to load data from Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      console.log('User ID or date changed, reloading data for user:', userId, format(selectedDate, 'yyyy-MM-dd'));
      loadAllData(selectedDate);
    }
  }, [userId, selectedDate]);

  const handleDateChange = (date: Date) => {
    console.log('Date changed to:', format(date, 'yyyy-MM-dd'), 'for user:', userId);
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
    goals,
    setGoals,
    allGoals,
    setAllGoals,
    archivedHabits,
    setArchivedHabits,
    deletedTasks,
    setDeletedTasks,
    deletedWeeklyOutputs,
    setDeletedWeeklyOutputs,
    deletedGoals,
    setDeletedGoals,
    isLoading,
    selectedDate,
    
    // Utils
    userId,
    loadAllData,
    handleDateChange,
  };
};