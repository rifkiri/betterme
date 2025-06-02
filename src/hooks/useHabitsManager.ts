
import { supabaseDataService } from '@/services/SupabaseDataService';
import { Habit } from '@/types/productivity';
import { toast } from 'sonner';

interface UseHabitsManagerProps {
  userId: string | null;
  isGoogleSheetsAvailable: () => boolean;
  loadAllData: () => Promise<void>;
  habits: Habit[];
  setHabits: (habits: Habit[] | ((prev: Habit[]) => Habit[])) => void;
  archivedHabits: Habit[];
  setArchivedHabits: (habits: Habit[] | ((prev: Habit[]) => Habit[])) => void;
}

export const useHabitsManager = ({
  userId,
  isGoogleSheetsAvailable: isSupabaseAvailable,
  loadAllData,
  habits,
  setHabits,
  archivedHabits,
  setArchivedHabits,
}: UseHabitsManagerProps) => {
  const addHabit = async (habit: Omit<Habit, 'id' | 'completed' | 'streak'>) => {
    if (!userId) return;

    const newHabit: Habit = {
      ...habit,
      id: crypto.randomUUID(),
      completed: false,
      streak: 0,
    };

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.addHabit({ ...newHabit, userId });
        await loadAllData();
        toast.success('Habit added successfully');
      } else {
        toast.error('Please sign in to add habits');
      }
    } catch (error) {
      toast.error('Failed to add habit');
      console.error('Failed to add habit:', error);
    }
  };

  const editHabit = async (id: string, updates: Partial<Habit>) => {
    if (!userId) return;

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateHabit(id, userId, updates);
        await loadAllData();
        toast.success('Habit updated successfully');
      } else {
        toast.error('Please sign in to edit habits');
      }
    } catch (error) {
      toast.error('Failed to update habit');
      console.error('Failed to update habit:', error);
    }
  };

  const toggleHabit = async (id: string) => {
    if (!userId) return;

    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const updates = {
      completed: !habit.completed,
      streak: !habit.completed ? habit.streak + 1 : Math.max(0, habit.streak - 1)
    };

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateHabit(id, userId, updates);
        await loadAllData();
      } else {
        toast.error('Please sign in to update habits');
      }
    } catch (error) {
      toast.error('Failed to update habit');
      console.error('Failed to update habit:', error);
    }
  };

  const archiveHabit = async (id: string) => {
    if (!userId) return;

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateHabit(id, userId, { archived: true });
        await loadAllData();
        toast.success('Habit archived');
      } else {
        toast.error('Please sign in to archive habits');
      }
    } catch (error) {
      toast.error('Failed to archive habit');
      console.error('Failed to archive habit:', error);
    }
  };

  const restoreHabit = async (id: string) => {
    if (!userId) return;

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateHabit(id, userId, { archived: false });
        await loadAllData();
        toast.success('Habit restored');
      } else {
        toast.error('Please sign in to restore habits');
      }
    } catch (error) {
      toast.error('Failed to restore habit');
      console.error('Failed to restore habit:', error);
    }
  };

  const permanentlyDeleteHabit = async (id: string) => {
    if (!userId) return;

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateHabit(id, userId, { isDeleted: true });
        await loadAllData();
        toast.success('Habit permanently deleted');
      } else {
        toast.error('Please sign in to delete habits');
      }
    } catch (error) {
      toast.error('Failed to delete habit');
      console.error('Failed to delete habit:', error);
    }
  };

  return {
    addHabit,
    editHabit,
    toggleHabit,
    archiveHabit,
    restoreHabit,
    permanentlyDeleteHabit,
  };
};
