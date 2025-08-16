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
      progress: 0, // Always start with 0% progress
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

    // Clamp progress between 0 and 100
    const clampedProgress = Math.max(0, Math.min(100, newProgress));

    console.log('🎯 [PROGRESS UPDATE] Starting - Goal:', goalId, 'Progress:', clampedProgress, 'User:', userId);

    // Optimistic UI update - immediately update local state
    const optimisticUpdates = { 
      progress: clampedProgress,
      completed: clampedProgress === 100 
    };
    
    setGoals(prevGoals => 
      prevGoals.map(goal => 
        goal.id === goalId 
          ? { ...goal, ...optimisticUpdates }
          : goal
      )
    );
    
    console.log('🎯 [PROGRESS UPDATE] Optimistic UI update applied');

    try {
      if (isSupabaseAvailable()) {
        console.log('🎯 [PROGRESS UPDATE] Calling database update...');
        await supabaseDataService.updateGoal(goalId, userId, optimisticUpdates);
        console.log('🎯 [PROGRESS UPDATE] Database update completed');
        
        console.log('🎯 [PROGRESS UPDATE] Refreshing data...');
        await loadAllData();
        console.log('🎯 [PROGRESS UPDATE] Data refresh completed');
        
        toast.success('Goal progress updated');
      } else {
        // Revert optimistic update on error
        setGoals(prevGoals => 
          prevGoals.map(goal => 
            goal.id === goalId 
              ? { ...goal, progress: goal.progress, completed: goal.completed }
              : goal
          )
        );
        toast.error('Please sign in to update goals');
      }
    } catch (error) {
      console.error('🎯 [PROGRESS UPDATE] Failed to update goal progress:', error);
      
      // Revert optimistic update on error
      console.log('🎯 [PROGRESS UPDATE] Reverting optimistic update due to error');
      await loadAllData(); // Reload fresh data to revert changes
      
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

  const deleteGoal = async (id: string, isAssignedGoal: boolean = false) => {
    if (!userId) return;

    if (isAssignedGoal) {
      console.log('User cannot delete assigned goal directly. Use leaveWorkGoal instead.');
      toast.error('You cannot delete this goal. You can only leave it if you are assigned to it.');
      return;
    }

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