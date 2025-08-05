import { supabaseDataService } from '@/services/SupabaseDataService';
import { Goal } from '@/types/productivity';
import { toast } from 'sonner';

interface UseGoalsManagerProps {
  userId: string | null;
  isGoogleSheetsAvailable: () => boolean;
  loadAllData: () => Promise<void>;
  goals: Goal[];
  setGoals: (goals: Goal[] | ((prev: Goal[]) => Goal[])) => void;
  deletedGoals: Goal[];
  setDeletedGoals: (goals: Goal[] | ((prev: Goal[]) => Goal[])) => void;
}

export const useGoalsManager = ({
  userId,
  isGoogleSheetsAvailable: isSupabaseAvailable,
  loadAllData,
  goals,
  setGoals,
  deletedGoals,
  setDeletedGoals,
}: UseGoalsManagerProps) => {
  
  const addGoal = async (goal: Omit<Goal, 'id' | 'progress'>) => {
    if (!userId) {
      console.log('No user ID for adding goal');
      toast.error('Please sign in to add goals');
      return;
    }

    const newGoal: Goal = {
      ...goal,
      id: crypto.randomUUID(),
      progress: goal.targetValue > 0 ? Math.round((goal.currentValue / goal.targetValue) * 100) : 0,
    };

    console.log('Adding goal for user:', userId, newGoal);

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.addGoal({ ...newGoal, userId });
        await loadAllData();
        toast.success('Goal added successfully');
      } else {
        toast.error('Please sign in to add goals');
      }
    } catch (error) {
      console.error('Failed to add goal for user', userId, ':', error);
      toast.error('Failed to add goal');
    }
  };

  const editGoal = async (id: string, updates: Partial<Goal>) => {
    if (!userId) {
      console.log('No user ID for editing goal');
      toast.error('Please sign in to edit goals');
      return;
    }

    console.log('Editing goal for user:', userId, 'goal:', id, 'updates:', updates);

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateGoal(id, userId, updates);
        await loadAllData();
        toast.success('Goal updated successfully');
      } else {
        toast.error('Please sign in to edit goals');
      }
    } catch (error) {
      console.error('Failed to update goal for user', userId, ':', error);
      toast.error('Failed to update goal');
    }
  };

  const updateGoalProgress = async (goalId: string, newProgress: number) => {
    if (!userId) {
      console.log('No user ID for updating goal progress');
      toast.error('Please sign in to update goals');
      return;
    }

    console.log('Updating goal progress for user:', userId, 'goal:', goalId, 'progress:', newProgress);

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateGoalProgress(goalId, userId, newProgress);
        await loadAllData();
        toast.success('Goal progress updated');
      } else {
        toast.error('Please sign in to update goals');
      }
    } catch (error) {
      console.error('Failed to update goal progress for user', userId, ':', error);
      toast.error('Failed to update goal progress');
    }
  };

  const moveGoal = async (id: string, newDeadline: Date) => {
    if (!userId) return;

    console.log('Moving goal deadline for user:', userId, 'goal:', id, 'to:', newDeadline);

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateGoal(id, userId, { deadline: newDeadline });
        await loadAllData();
        toast.success('Goal deadline updated');
      } else {
        toast.error('Please sign in to move goals');
      }
    } catch (error) {
      console.error('Failed to move goal for user', userId, ':', error);
      toast.error('Failed to update goal deadline');
    }
  };

  const deleteGoal = async (id: string) => {
    if (!userId) return;

    console.log('Soft deleting goal for user:', userId, 'goal:', id);

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateGoal(id, userId, { archived: true });
        await loadAllData();
        toast.success('Goal deleted');
      } else {
        toast.error('Please sign in to delete goals');
      }
    } catch (error) {
      console.error('Failed to delete goal for user', userId, ':', error);
      toast.error('Failed to delete goal');
    }
  };

  const restoreGoal = async (id: string) => {
    if (!userId) return;

    console.log('Restoring goal for user:', userId, 'goal:', id);

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateGoal(id, userId, { archived: false });
        await loadAllData();
        toast.success('Goal restored');
      } else {
        toast.error('Please sign in to restore goals');
      }
    } catch (error) {
      console.error('Failed to restore goal for user', userId, ':', error);
      toast.error('Failed to restore goal');
    }
  };

  const permanentlyDeleteGoal = async (id: string) => {
    if (!userId) return;

    console.log('Permanently deleting goal for user:', userId, 'goal:', id);

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.permanentlyDeleteGoal(id, userId);
        await loadAllData();
        toast.success('Goal permanently deleted');
      } else {
        toast.error('Please sign in to delete goals');
      }
    } catch (error) {
      console.error('Failed to permanently delete goal for user', userId, ':', error);
      toast.error('Failed to delete goal');
    }
  };

  const getOverdueGoals = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return goals.filter(goal => 
      goal.deadline && 
      new Date(goal.deadline) < today && 
      !goal.completed
    );
  };

  return {
    addGoal,
    editGoal,
    updateGoalProgress,
    moveGoal,
    deleteGoal,
    restoreGoal,
    permanentlyDeleteGoal,
    getOverdueGoals,
  };
};