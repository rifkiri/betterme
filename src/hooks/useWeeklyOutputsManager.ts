
import { supabaseDataService } from '@/services/SupabaseDataService';
import { WeeklyOutput } from '@/types/productivity';
import { toast } from 'sonner';

interface UseWeeklyOutputsManagerProps {
  userId: string | null;
  isSupabaseAvailable: () => boolean;
  loadAllData: () => Promise<void>;
  weeklyOutputs: WeeklyOutput[];
  setWeeklyOutputs: (outputs: WeeklyOutput[] | ((prev: WeeklyOutput[]) => WeeklyOutput[])) => void;
  deletedWeeklyOutputs: WeeklyOutput[];
  setDeletedWeeklyOutputs: (outputs: WeeklyOutput[] | ((prev: WeeklyOutput[]) => WeeklyOutput[])) => void;
}

export const useWeeklyOutputsManager = ({
  userId,
  isSupabaseAvailable,
  loadAllData,
  weeklyOutputs,
  setWeeklyOutputs,
  deletedWeeklyOutputs,
  setDeletedWeeklyOutputs,
}: UseWeeklyOutputsManagerProps) => {
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
        console.log('Attempting to update in Supabase...');
        await supabaseDataService.updateWeeklyOutput(id, userId, updates);
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
    console.log('updateProgress called with:', { outputId, newProgress, userId });
    
    if (!userId) {
      console.error('No user ID found for progress update');
      toast.error('Please sign in to update progress');
      return;
    }

    const output = weeklyOutputs.find(o => o.id === outputId);
    if (!output) {
      console.error('Output not found:', outputId);
      toast.error('Weekly output not found');
      return;
    }

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

    try {
      await editWeeklyOutput(outputId, updates);
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast.error('Failed to update progress');
    }
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
