
import { supabaseDataService } from '@/services/SupabaseDataService';
import { WeeklyOutput, Goal } from '@/types/productivity';
import { toast } from 'sonner';
import { supabaseWeeklyOutputsService } from '@/services/SupabaseWeeklyOutputsService';
import { linkageSynchronizationService } from '@/services/LinkageSynchronizationService';

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
    console.log('🚀 [Manager] addWeeklyOutput called with:', { 
      title: output.title, 
      selectedGoalIds, 
      userId 
    });
    
    if (!userId) {
      console.error('❌ [Manager] No user ID found');
      toast.error('Please sign in to add weekly outputs');
      return;
    }

    // Create the output object (provide dummy ID since database will generate the real one)
    const newOutput: WeeklyOutput = {
      ...output,
      id: 'temp-id', // This will be replaced by database-generated ID
      createdDate: new Date(),
      linkedGoalIds: selectedGoalIds,
    };

    console.log('📝 [Manager] Creating output in database...');

    try {
      if (isSupabaseAvailable()) {
        // Step 1: Create the output in database (database will generate the real ID)
        await supabaseWeeklyOutputsService.addWeeklyOutput({ ...newOutput, userId });
        console.log('✅ [Manager] Output created in database');
        
        // Step 2: Find the created output to get the real database-generated ID
        console.log('🔍 [Manager] Fetching created output to get real ID...');
        const outputs = await supabaseWeeklyOutputsService.getWeeklyOutputs(userId);
        const createdOutput = outputs
          .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
          .find(wo => wo.title === output.title && wo.description === output.description);
        
        if (!createdOutput) {
          console.error('❌ [Manager] Could not find created output');
          toast.error('Output created but linking failed - could not locate output');
          return;
        }
        
        console.log('🎯 [Manager] Found created output with real ID:', createdOutput.id);
        
        // Step 3: Synchronize linkages using the real database ID
        if (selectedGoalIds.length > 0) {
          console.log('🔗 [Manager] Starting linkage synchronization...');
          try {
            await linkageSynchronizationService.syncWeeklyOutputCreation(
              createdOutput.id, 
              selectedGoalIds, 
              userId
            );
            console.log('✅ [Manager] Linkage synchronization completed');
          } catch (linkError) {
            console.error('❌ [Manager] Linkage synchronization failed:', linkError);
            toast.error('Output created but goal linking failed');
          }
        } else {
          console.log('ℹ️ [Manager] No goals to link');
        }
        
        console.log('🔄 [Manager] Reloading data...');
        await loadAllData();
        toast.success('Weekly output added successfully');
        
      } else {
        toast.error('Please sign in to add weekly outputs');
      }
    } catch (error) {
      console.error('❌ [Manager] Failed to create weekly output:', error);
      toast.error('Failed to create weekly output: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
