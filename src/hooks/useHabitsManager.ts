
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

    console.log('Adding habit for user:', userId, newHabit);

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.addHabit({ ...newHabit, userId });
        await loadAllData(selectedDate);
        toast.success('Habit added successfully');
      } else {
        toast.error('Please sign in to add habits');
      }
    } catch (error) {
      console.error('Failed to add habit for user', userId, ':', error);
      toast.error('Failed to add habit');
    }
  };

  const editHabit = async (id: string, updates: Partial<Habit>) => {
    if (!userId) {
      console.log('No user ID for editing habit');
      toast.error('Please sign in to edit habits');
      return;
    }

    console.log('Editing habit for user:', userId, 'habit:', id, 'updates:', updates);

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateHabit(id, userId, updates);
        await loadAllData(selectedDate);
        toast.success('Habit updated successfully');
      } else {
        toast.error('Please sign in to edit habits');
      }
    } catch (error) {
      console.error('Failed to update habit for user', userId, ':', error);
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
      console.log('Habit not found for user:', userId, 'habit:', id);
      return;
    }

    const newCompleted = !habit.completed;

    console.log('Toggling habit for user:', userId, 'habit:', id, 'from', habit.completed, 'to', newCompleted, 'for date:', selectedDate);

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.toggleHabitForDate(id, userId, selectedDate, newCompleted);
        await loadAllData(selectedDate);
        console.log('Habit toggled successfully for user:', userId);
      } else {
        toast.error('Please sign in to update habits');
      }
    } catch (error) {
      console.error('Failed to update habit for user', userId, ':', error);
      toast.error('Failed to update habit');
    }
  };

  const archiveHabit = async (id: string) => {
    if (!userId) return;

    console.log('Archiving habit for user:', userId, 'habit:', id);

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateHabit(id, userId, { archived: true });
        await loadAllData(selectedDate);
        toast.success('Habit archived');
      } else {
        toast.error('Please sign in to archive habits');
      }
    } catch (error) {
      toast.error('Failed to archive habit');
      console.error('Failed to archive habit for user', userId, ':', error);
    }
  };

  const restoreHabit = async (id: string) => {
    if (!userId) return;

    console.log('Restoring habit for user:', userId, 'habit:', id);

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateHabit(id, userId, { archived: false });
        await loadAllData(selectedDate);
        toast.success('Habit restored');
      } else {
        toast.error('Please sign in to restore habits');
      }
    } catch (error) {
      toast.error('Failed to restore habit');
      console.error('Failed to restore habit for user', userId, ':', error);
    }
  };

  const permanentlyDeleteHabit = async (id: string) => {
    if (!userId) return;

    console.log('Permanently deleting habit for user:', userId, 'habit:', id);

    try {
      if (isSupabaseAvailable()) {
        // Actually delete the habit permanently from the database
        await supabaseDataService.permanentlyDeleteHabit(id, userId);
        await loadAllData(selectedDate);
        toast.success('Habit permanently deleted');
      } else {
        toast.error('Please sign in to delete habits');
      }
    } catch (error) {
      toast.error('Failed to delete habit');
      console.error('Failed to delete habit for user', userId, ':', error);
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
