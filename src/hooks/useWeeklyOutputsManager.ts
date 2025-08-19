
import { supabaseDataService } from '@/services/SupabaseDataService';
import { WeeklyOutput, Goal } from '@/types/productivity';
import { toast } from 'sonner';
import { supabaseWeeklyOutputsService } from '@/services/SupabaseWeeklyOutputsService';

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

  const addWeeklyOutput = async (output: Omit<WeeklyOutput, 'id' | 'createdDate'>, selectedGoalIds: string[] = []) => {
    if (!userId) {
      console.error('No user ID found');
      return;
    }

    const outputId = crypto.randomUUID();
    const newOutput: WeeklyOutput = {
      ...output,
      id: outputId,
      createdDate: new Date(),
      linkedGoalIds: selectedGoalIds, // Store linked goals during creation
    };

    console.log('🔥 [Manager] Adding weekly output:', newOutput);
    console.log('🔥 [Manager] Selected goal IDs:', selectedGoalIds);

    try {
      if (isSupabaseAvailable()) {
        console.log('🔥 [Manager] Attempting to save to Supabase...');
        await supabaseWeeklyOutputsService.addWeeklyOutput({ ...newOutput, userId });
        console.log('🔥 [Manager] Output saved to Supabase successfully');
        
        // Synchronize linkages to item_linkages table if any were selected
        if (selectedGoalIds.length > 0) {
          console.log('🔥 [Manager] Synchronizing linkages to item_linkages table...');
          console.log('🔥 [Manager] About to import LinkageSynchronizationService...');
          try {
            const { linkageSynchronizationService } = await import('@/services/LinkageSynchronizationService');
            console.log('🔥 [Manager] Successfully imported LinkageSynchronizationService');
            console.log('🔥 [Manager] About to call syncWeeklyOutputCreation with:', { outputId, selectedGoalIds, userId });
            await linkageSynchronizationService.syncWeeklyOutputCreation(outputId, selectedGoalIds, userId);
            console.log('🔥 [Manager] Linkage synchronization completed successfully');
          } catch (linkError) {
            console.error('🔥 [Manager] Failed to synchronize linkages:', linkError);
            console.error('🔥 [Manager] LinkError details:', {
              message: linkError.message,
              stack: linkError.stack,
              name: linkError.name
            });
            toast.error('Output created but failed to synchronize linkages');
          }
        }
        
        console.log('🔥 [Manager] Reloading all data...');
        await loadAllData();
        console.log('🔥 [Manager] Data reload complete');
        toast.success('Weekly output added successfully');
      } else {
        toast.error('Please sign in to add weekly outputs');
      }
    } catch (error) {
      console.error('🔥 [Manager] Failed to save weekly output:', error);
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
        console.log('Attempting to update in Supabase...');
        await supabaseDataService.updateWeeklyOutput(id, userId, updates);
        
        // Goal linking is now handled separately through ItemLinkageService
        
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
