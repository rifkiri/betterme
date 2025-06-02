
import { googleSheetsService } from '@/services/GoogleSheetsService';
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
  isGoogleSheetsAvailable,
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
      id: Date.now().toString(),
      completed: false,
      streak: 0,
    };

    try {
      if (isGoogleSheetsAvailable()) {
        await googleSheetsService.addHabit({ ...newHabit, userId });
        await loadAllData();
        toast.success('Habit added successfully');
      } else {
        toast.error('Google Sheets not available');
      }
    } catch (error) {
      toast.error('Failed to add habit');
      setHabits(prev => [...prev, newHabit]);
    }
  };

  const editHabit = async (id: string, updates: Partial<Habit>) => {
    if (!userId) return;

    try {
      if (isGoogleSheetsAvailable()) {
        await googleSheetsService.updateHabit(id, userId, updates);
        await loadAllData();
        toast.success('Habit updated successfully');
      } else {
        toast.error('Google Sheets not available');
      }
    } catch (error) {
      toast.error('Failed to update habit');
      setHabits(prev => prev.map(habit => 
        habit.id === id ? { ...habit, ...updates } : habit
      ));
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
      if (isGoogleSheetsAvailable()) {
        await googleSheetsService.updateHabit(id, userId, updates);
        await loadAllData();
      } else {
        toast.error('Google Sheets not available');
      }
    } catch (error) {
      toast.error('Failed to update habit');
      setHabits(prev => prev.map(habit => 
        habit.id === id ? { ...habit, ...updates } : habit
      ));
    }
  };

  const archiveHabit = async (id: string) => {
    if (!userId) return;

    try {
      if (isGoogleSheetsAvailable()) {
        await googleSheetsService.updateHabit(id, userId, { archived: true });
        await loadAllData();
        toast.success('Habit archived');
      } else {
        toast.error('Google Sheets not available');
      }
    } catch (error) {
      toast.error('Failed to archive habit');
      const habitToArchive = habits.find(habit => habit.id === id);
      if (habitToArchive) {
        setArchivedHabits(prev => [...prev, { ...habitToArchive, archived: true }]);
        setHabits(prev => prev.filter(habit => habit.id !== id));
      }
    }
  };

  const restoreHabit = async (id: string) => {
    if (!userId) return;

    try {
      if (isGoogleSheetsAvailable()) {
        await googleSheetsService.updateHabit(id, userId, { archived: false });
        await loadAllData();
        toast.success('Habit restored');
      } else {
        toast.error('Google Sheets not available');
      }
    } catch (error) {
      toast.error('Failed to restore habit');
      const habitToRestore = archivedHabits.find(habit => habit.id === id);
      if (habitToRestore) {
        setHabits(prev => [...prev, { ...habitToRestore, archived: false }]);
        setArchivedHabits(prev => prev.filter(habit => habit.id !== id));
      }
    }
  };

  const permanentlyDeleteHabit = async (id: string) => {
    setArchivedHabits(prev => prev.filter(habit => habit.id !== id));
    toast.success('Habit permanently deleted');
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
