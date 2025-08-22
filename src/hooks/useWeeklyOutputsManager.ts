import { supabaseDataService } from '@/services/SupabaseDataService';
import { WeeklyOutput, Goal } from '@/types/productivity';
import { toast } from 'sonner';
import { supabaseWeeklyOutputsService } from '@/services/SupabaseWeeklyOutputsService';

interface UseWeeklyOutputsManagerProps {
  userId: string | null;
  loadAllData: () => Promise<void>;
  weeklyOutputs: WeeklyOutput[];
  setWeeklyOutputs: (outputs: WeeklyOutput[] | ((prev: WeeklyOutput[]) => WeeklyOutput[])) => void;
  deletedWeeklyOutputs: WeeklyOutput[];
  setDeletedWeeklyOutputs: (outputs: WeeklyOutput[] | ((prev: WeeklyOutput[]) => WeeklyOutput[])) => void;
  goals: Goal[];
}

export const useWeeklyOutputsManager = ({
  userId,
  loadAllData,
  weeklyOutputs,
  setWeeklyOutputs,
  deletedWeeklyOutputs,
  setDeletedWeeklyOutputs,
  goals,
}: UseWeeklyOutputsManagerProps) => {

  const addWeeklyOutput = async (output: Omit<WeeklyOutput, 'id' | 'createdDate'>) => {
    if (!userId) {
      toast.error('Please sign in to add weekly outputs');
      return;
    }

    const newOutput: WeeklyOutput = {
      ...output,
      id: crypto.randomUUID(),
      createdDate: new Date(),
      dueDate: output.dueDate || new Date(),
      isMoved: false,
      isDeleted: false,
      progress: 0,
    };

    try {
      await supabaseWeeklyOutputsService.addWeeklyOutput({ ...newOutput, userId });
      await loadAllData();
      toast.success('Weekly output added successfully');
    } catch (error) {
      console.error('Failed to add weekly output:', error);
      toast.error('Failed to add weekly output: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const editWeeklyOutput = async (id: string, updates: Partial<WeeklyOutput>) => {
    if (!userId) {
      console.error('No user ID found');
      return;
    }

    console.log('Editing weekly output:', { id, updates });

    try {
      console.log('Attempting to update in Supabase...');
      await supabaseWeeklyOutputsService.updateWeeklyOutput(id, userId, updates);
      
      console.log('Successfully updated in Supabase, reloading data...');
      await loadAllData();
      toast.success('Weekly output updated successfully');
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
      await supabaseWeeklyOutputsService.updateWeeklyOutput(id, userId, { isDeleted: true, deletedDate: new Date() });
      await loadAllData();
      toast.success('Weekly output deleted');
    } catch (error) {
      toast.error('Failed to delete weekly output');
      console.error('Failed to delete weekly output:', error);
    }
  };

  const restoreWeeklyOutput = async (id: string) => {
    if (!userId) return;

    try {
      await supabaseWeeklyOutputsService.updateWeeklyOutput(id, userId, { isDeleted: false, deletedDate: undefined });
      await loadAllData();
      toast.success('Weekly output restored');
    } catch (error) {
      toast.error('Failed to restore weekly output');
      console.error('Failed to restore weekly output:', error);
    }
  };

  const permanentlyDeleteWeeklyOutput = async (id: string) => {
    if (!userId) return;

    try {
      // Actually delete the weekly output permanently from the database
      await supabaseWeeklyOutputsService.permanentlyDeleteWeeklyOutput(id, userId);
      await loadAllData();
      toast.success('Weekly output permanently deleted');
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