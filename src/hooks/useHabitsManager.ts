import { supabaseDataService } from '@/services/SupabaseDataService';
import { Habit } from '@/types/productivity';
import { toast } from 'sonner';

interface UseHabitsManagerProps {
  userId: string | null;
  isGoogleSheetsAvailable: () => boolean;
  loadAllData: (date?: Date) => Promise<void>;
  habits: Habit[];
  setHabits: (habits: Habit[] | ((prev: Habit[]) => Habit[])) => void;
  archivedHabits: Habit[];
  setArchivedHabits: (habits: Habit[] | ((prev: Habit[]) => Habit[])) => void;
  selectedDate: Date;
}

export const useHabitsManager = ({
  userId,
  isGoogleSheetsAvailable: isSupabaseAvailable,
  loadAllData,
  habits,
  setHabits,
  archivedHabits,
  setArchivedHabits,
  selectedDate,
}: UseHabitsManagerProps) => {
  const addHabit = async (habit: Omit<Habit, 'id' | 'completed' | 'streak'>) => {
    if (!userId) {
      console.log('No user ID for adding habit');
      toast.error('Please sign in to add habits');
      return;
    }

    const newHabit: Habit = {
      ...habit,
      id: crypto.randomUUID(),
      completed: false,
      streak: 0,
    };

    console.log('Adding habit:', newHabit);

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.addHabit({ ...newHabit, userId });
        await loadAllData();
        toast.success('Habit added successfully');
      } else {
        toast.error('Please sign in to add habits');
      }
    } catch (error) {
      console.error('Failed to add habit:', error);
      toast.error('Failed to add habit');
    }
  };

  const editHabit = async (id: string, updates: Partial<Habit>) => {
    if (!userId) {
      console.log('No user ID for editing habit');
      toast.error('Please sign in to edit habits');
      return;
    }

    console.log('Editing habit:', id, updates);

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateHabit(id, userId, updates);
        await loadAllData();
        toast.success('Habit updated successfully');
      } else {
        toast.error('Please sign in to edit habits');
      }
    } catch (error) {
      console.error('Failed to update habit:', error);
      toast.error('Failed to update habit');
    }
  };

  const toggleHabit = async (id: string) => {
    if (!userId) {
      console.log('No user ID for toggling habit');
      toast.error('Please sign in to update habits');
      return;
    }

    const habit = habits.find(h => h.id === id);
    if (!habit) {
      console.log('Habit not found:', id);
      return;
    }

    const newCompleted = !habit.completed;

    console.log('Toggling habit:', id, 'from', habit.completed, 'to', newCompleted, 'for date:', selectedDate);

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.toggleHabitForDate(id, userId, selectedDate, newCompleted);
        await loadAllData(selectedDate);
        console.log('Habit toggled successfully');
      } else {
        toast.error('Please sign in to update habits');
      }
    } catch (error) {
      console.error('Failed to update habit:', error);
      toast.error('Failed to update habit');
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
