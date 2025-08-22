
import { supabaseDataService } from '@/services/SupabaseDataService';
import { Habit, Goal } from '@/types/productivity';
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
  goals: Goal[];
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
  goals,
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

    console.log('useHabitsManager - Editing habit for user:', userId, 'habit:', id, 'updates:', updates);
    console.log('useHabitsManager - linkedGoalId in updates:', updates.linkedGoalId);

    try {
      if (isSupabaseAvailable()) {
        console.log('useHabitsManager - Calling supabaseDataService.updateHabit');
        await supabaseDataService.updateHabit(id, userId, updates);
        console.log('useHabitsManager - Database update completed, reloading data');
        await loadAllData(selectedDate);
        console.log('useHabitsManager - Data reload completed');
        toast.success('Habit updated successfully');
      } else {
        toast.error('Please sign in to edit habits');
      }
    } catch (error) {
      console.error('useHabitsManager - Failed to update habit for user', userId, ':', error);
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
        // Toggle the habit completion
        await supabaseDataService.toggleHabitForDate(id, userId, selectedDate, newCompleted);
        
        // If habit has linked goal, update goal progress
        if (habit.linkedGoalId) {
          console.log('Habit has linked goal:', habit.linkedGoalId, 'updating goal progress...');
          
          // Find the linked goal from the goals array
          const linkedGoal = goals.find(g => g.id === habit.linkedGoalId);
          if (linkedGoal) {
            // Calculate new progress based on habit completion
            // Each habit completion adds/removes 10% progress (you can adjust this)
            const progressChange = newCompleted ? 10 : -10;
            const newProgress = Math.max(0, Math.min(100, linkedGoal.progress + progressChange));
            
            console.log('Updating goal progress from', linkedGoal.progress, 'to', newProgress);
            
            // Update goal progress
            await supabaseDataService.updateGoalProgress(habit.linkedGoalId, userId, newProgress);
            
            toast.success(newCompleted ? 
              `Habit completed! Goal "${linkedGoal.title}" progress updated to ${newProgress}%` : 
              `Habit uncompleted. Goal "${linkedGoal.title}" progress updated to ${newProgress}%`
            );
          } else {
            console.log('Linked goal not found in current goals list');
          }
        }
        
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
