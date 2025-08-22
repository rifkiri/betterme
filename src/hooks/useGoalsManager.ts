import { supabaseDataService } from '@/services/SupabaseDataService';
import { Goal } from '@/types/productivity';
import { toast } from 'sonner';

interface UseGoalsManagerProps {
  userId: string | null;
  loadAllData: () => Promise<void>;
  goals: Goal[];
  setGoals: (goals: Goal[] | ((prev: Goal[]) => Goal[])) => void;
  deletedGoals: Goal[];
  setDeletedGoals: (goals: Goal[] | ((prev: Goal[]) => Goal[])) => void;
}

export const useGoalsManager = ({
  userId,
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
      await supabaseDataService.addGoal({ ...newGoal, userId });
      await loadAllData();
      toast.success('Goal added successfully');
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
      await supabaseDataService.updateGoal(id, userId, updates);
      await loadAllData();
      toast.success('Goal updated successfully');
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
      console.log('🎯 [PROGRESS UPDATE] Calling database update...');
      await supabaseDataService.updateGoalProgress(goalId, userId, clampedProgress);
      console.log('🎯 [PROGRESS UPDATE] Database update completed');
      
      console.log('🎯 [PROGRESS UPDATE] Refreshing data...');
      await loadAllData();
      console.log('🎯 [PROGRESS UPDATE] Data refresh completed');
      
      toast.success('Goal progress updated');
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
      await supabaseDataService.updateGoal(id, userId, { deadline: newDeadline });
      await loadAllData();
      toast.success('Goal deadline updated');
    } catch (error) {
      console.error('Failed to move goal for user', userId, ':', error);
      toast.error('Failed to update goal deadline');
    }
  };

  const deleteGoal = async (id: string, isAssignedGoal: boolean = false) => {
    if (!userId) {
      console.log('❌ [DELETE GOAL] No user ID');
      toast.error('Please sign in to delete goals');
      return;
    }

    console.log('🗑️ [DELETE GOAL] Starting delete - Goal:', id, 'User:', userId, 'IsAssigned:', isAssignedGoal);

    // Find the goal to check ownership
    const goalToDelete = goals.find(g => g.id === id);
    if (!goalToDelete) {
      console.log('❌ [DELETE GOAL] Goal not found:', id);
      toast.error('Goal not found');
      return;
    }

    console.log('🗑️ [DELETE GOAL] Goal details:', {
      goalId: id,
      goalUserId: goalToDelete.userId,
      currentUserId: userId,
      isOwner: goalToDelete.userId === userId,
      category: goalToDelete.category
    });

    if (isAssignedGoal) {
      console.log('❌ [DELETE GOAL] User cannot delete assigned goal directly. Use leaveWorkGoal instead.');
      toast.error('You cannot delete this goal. You can only leave it if you are assigned to it.');
      return;
    }

    console.log('🗑️ [DELETE GOAL] Proceeding with soft delete for user:', userId, 'goal:', id);

    try {
      await supabaseDataService.updateGoal(id, userId, { archived: true });
      await loadAllData();
      toast.success('Goal deleted');
    } catch (error) {
      console.error('Failed to delete goal for user', userId, ':', error);
      toast.error('Failed to delete goal');
    }
  };

  const restoreGoal = async (id: string) => {
    if (!userId) return;

    console.log('Restoring goal for user:', userId, 'goal:', id);

    try {
      await supabaseDataService.updateGoal(id, userId, { archived: false });
      await loadAllData();
      toast.success('Goal restored');
    } catch (error) {
      console.error('Failed to restore goal for user', userId, ':', error);
      toast.error('Failed to restore goal');
    }
  };

  const permanentlyDeleteGoal = async (id: string) => {
    if (!userId) return;

    console.log('Permanently deleting goal for user:', userId, 'goal:', id);

    try {
      await supabaseDataService.permanentlyDeleteGoal(id, userId);
      await loadAllData();
      toast.success('Goal permanently deleted');
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