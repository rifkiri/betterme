
import { supabaseDataService } from '@/services/SupabaseDataService';
import { WeeklyOutput, Goal } from '@/types/productivity';
import { toast } from 'sonner';

interface UseWeeklyOutputsManagerProps {
  userId: string | null;
  isGoogleSheetsAvailable: () => boolean;
  loadAllData: () => Promise<void>;
  weeklyOutputs: WeeklyOutput[];
  setWeeklyOutputs: (outputs: WeeklyOutput[] | ((prev: WeeklyOutput[]) => WeeklyOutput[])) => void;
  deletedWeeklyOutputs: WeeklyOutput[];
  setDeletedWeeklyOutputs: (outputs: WeeklyOutput[] | ((prev: WeeklyOutput[]) => WeeklyOutput[])) => void;
  goals: Goal[];
}

export const useWeeklyOutputsManager = ({
  userId,
  isGoogleSheetsAvailable: isSupabaseAvailable,
  loadAllData,
  weeklyOutputs,
  setWeeklyOutputs,
  deletedWeeklyOutputs,
  setDeletedWeeklyOutputs,
  goals,
}: UseWeeklyOutputsManagerProps) => {

  // Helper function to update bidirectional goal-output linking
  const updateGoalLinks = async (outputId: string, linkedGoalIds: string[] = [], previousLinkedGoalIds: string[] = []) => {
    if (!userId) return;

    try {
      // Goals to add the output to (new links)
      const goalsToAddTo = linkedGoalIds.filter(goalId => !previousLinkedGoalIds.includes(goalId));
      
      // Goals to remove the output from (removed links)
      const goalsToRemoveFrom = previousLinkedGoalIds.filter(goalId => !linkedGoalIds.includes(goalId));

      // Update goals that should have this output added to their linkedOutputIds
      for (const goalId of goalsToAddTo) {
        const goal = goals.find(g => g.id === goalId);
        if (goal) {
          const currentLinkedOutputIds = goal.linkedOutputIds || [];
          if (!currentLinkedOutputIds.includes(outputId)) {
            const updatedLinkedOutputIds = [...currentLinkedOutputIds, outputId];
            try {
              await supabaseDataService.updateGoal(goalId, userId, { linkedOutputIds: updatedLinkedOutputIds });
              console.log('Successfully linked output', outputId, 'to goal', goalId);
            } catch (linkError) {
              console.error('Failed to link output to goal:', goalId, linkError);
              toast.error(`Failed to link to goal: ${goal.title}`);
            }
          }
        }
      }

      // Update goals that should have this output removed from their linkedOutputIds
      for (const goalId of goalsToRemoveFrom) {
        const goal = goals.find(g => g.id === goalId);
        if (goal) {
          const currentLinkedOutputIds = goal.linkedOutputIds || [];
          if (currentLinkedOutputIds.includes(outputId)) {
            const updatedLinkedOutputIds = currentLinkedOutputIds.filter(id => id !== outputId);
            try {
              await supabaseDataService.updateGoal(goalId, userId, { linkedOutputIds: updatedLinkedOutputIds });
              console.log('Successfully unlinked output', outputId, 'from goal', goalId);
            } catch (unlinkError) {
              console.error('Failed to unlink output from goal:', goalId, unlinkError);
              toast.error(`Failed to unlink from goal: ${goal.title}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to update goal links:', error);
      toast.error('Failed to update goal links');
    }
  };
  const addWeeklyOutput = async (output: Omit<WeeklyOutput, 'id' | 'createdDate'>) => {
    if (!userId) {
      console.error('No user ID found');
      return;
    }

    const newOutput: WeeklyOutput = {
      ...output,
      id: crypto.randomUUID(),
      createdDate: new Date(),
    };

    console.log('Adding weekly output:', newOutput);

    try {
      if (isSupabaseAvailable()) {
        console.log('Attempting to save to Supabase...');
        await supabaseDataService.addWeeklyOutput({ ...newOutput, userId });
        
        // Update bidirectional goal linking
        if (newOutput.linkedGoalIds && newOutput.linkedGoalIds.length > 0) {
          await updateGoalLinks(newOutput.id, newOutput.linkedGoalIds, []);
        }
        
        console.log('Successfully saved to Supabase, reloading data...');
        await loadAllData();
        toast.success('Weekly output added successfully');
      } else {
        toast.error('Please sign in to add weekly outputs');
      }
    } catch (error) {
      console.error('Failed to save weekly output:', error);
      toast.error('Failed to save weekly output: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const editWeeklyOutput = async (id: string, updates: Partial<WeeklyOutput>) => {
    if (!userId) {
      console.error('No user ID found');
      return;
    }

    console.log('Editing weekly output:', { id, updates });

    try {
      if (isSupabaseAvailable()) {
        // Get the current output to compare linkedGoalIds
        const currentOutput = weeklyOutputs.find(output => output.id === id);
        const previousLinkedGoalIds = currentOutput?.linkedGoalIds || [];
        const newLinkedGoalIds = updates.linkedGoalIds || previousLinkedGoalIds;

        console.log('Attempting to update in Supabase...');
        await supabaseDataService.updateWeeklyOutput(id, userId, updates);
        
        // Update bidirectional goal linking if linkedGoalIds changed
        if (updates.linkedGoalIds !== undefined) {
          await updateGoalLinks(id, newLinkedGoalIds, previousLinkedGoalIds);
        }
        
        console.log('Successfully updated in Supabase, reloading data...');
        await loadAllData();
        toast.success('Weekly output updated successfully');
      } else {
        toast.error('Please sign in to edit weekly outputs');
      }
    } catch (error) {
      console.error('Failed to update weekly output:', error);
      toast.error('Failed to update weekly output: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const updateProgress = async (outputId: string, newProgress: number) => {
    if (!userId) return;

    const output = weeklyOutputs.find(o => o.id === outputId);
    if (!output) return;

    const newProgressValue = Math.max(0, Math.min(100, newProgress));
    const updates: Partial<WeeklyOutput> = { progress: newProgressValue };

    console.log('Updating progress:', { outputId, newProgress: newProgressValue, currentProgress: output.progress });

    if (newProgressValue === 100 && output.progress < 100) {
      updates.completedDate = new Date();
      console.log('Setting completedDate to:', updates.completedDate);
    } else if (newProgressValue < 100 && output.progress === 100) {
      updates.completedDate = undefined;
      console.log('Removing completedDate');
    }

    await editWeeklyOutput(outputId, updates);
  };

  const moveWeeklyOutput = async (id: string, newDueDate: Date) => {
    if (!userId) return;

    const output = weeklyOutputs.find(o => o.id === id);
    if (!output) return;

    const updates = {
      dueDate: newDueDate,
      originalDueDate: output.originalDueDate || output.dueDate,
      isMoved: true
    };

    await editWeeklyOutput(id, updates);
  };

  const deleteWeeklyOutput = async (id: string) => {
    if (!userId) return;

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateWeeklyOutput(id, userId, { isDeleted: true, deletedDate: new Date() });
        await loadAllData();
        toast.success('Weekly output deleted');
      } else {
        toast.error('Please sign in to delete weekly outputs');
      }
    } catch (error) {
      toast.error('Failed to delete weekly output');
      console.error('Failed to delete weekly output:', error);
    }
  };

  const restoreWeeklyOutput = async (id: string) => {
    if (!userId) return;

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateWeeklyOutput(id, userId, { isDeleted: false, deletedDate: undefined });
        await loadAllData();
        toast.success('Weekly output restored');
      } else {
        toast.error('Please sign in to restore weekly outputs');
      }
    } catch (error) {
      toast.error('Failed to restore weekly output');
      console.error('Failed to restore weekly output:', error);
    }
  };

  const permanentlyDeleteWeeklyOutput = async (id: string) => {
    if (!userId) return;

    try {
      if (isSupabaseAvailable()) {
        // Actually delete the weekly output permanently from the database
        await supabaseDataService.permanentlyDeleteWeeklyOutput(id, userId);
        await loadAllData();
        toast.success('Weekly output permanently deleted');
      } else {
        toast.error('Please sign in to delete weekly outputs');
      }
    } catch (error) {
      toast.error('Failed to delete weekly output');
      console.error('Failed to delete weekly output:', error);
    }
  };

  return {
    addWeeklyOutput,
    editWeeklyOutput,
    updateProgress,
    moveWeeklyOutput,
    deleteWeeklyOutput,
    restoreWeeklyOutput,
    permanentlyDeleteWeeklyOutput,
  };
};
