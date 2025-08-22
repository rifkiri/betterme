
import { useState } from 'react';
import { WeeklyOutput } from '@/types/productivity';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { toast } from 'sonner';

interface UseWeeklyOutputsManagerProps {
  userId: string;
  isGoogleSheetsAvailable: () => boolean;
  loadAllData: () => void;
  weeklyOutputs: WeeklyOutput[];
  setWeeklyOutputs: (outputs: WeeklyOutput[]) => void;
  deletedWeeklyOutputs: WeeklyOutput[];
  setDeletedWeeklyOutputs: (outputs: WeeklyOutput[]) => void;
  goals: any[];
}

export const useWeeklyOutputsManager = (props: UseWeeklyOutputsManagerProps) => {
  const [loading, setLoading] = useState(false);

  const addWeeklyOutput = async (output: Omit<WeeklyOutput, 'id' | 'createdDate'>) => {
    if (!props.userId) {
      console.log('No user ID for adding weekly output');
      toast.error('Please sign in to add weekly outputs');
      return;
    }

    const newOutput: WeeklyOutput = {
      ...output,
      id: crypto.randomUUID(),
      createdDate: new Date(),
    };

    console.log('Adding weekly output for user:', props.userId, newOutput);

    setLoading(true);
    try {
      if (props.isGoogleSheetsAvailable()) {
        await supabaseDataService.addWeeklyOutput({ ...newOutput, userId: props.userId });
        await props.loadAllData();
        toast.success('Weekly output added successfully');
      } else {
        toast.error('Please sign in to add weekly outputs');
      }
    } catch (error) {
      console.error('Failed to add weekly output for user', props.userId, ':', error);
      toast.error('Failed to add weekly output');
    } finally {
      setLoading(false);
    }
  };

  const editWeeklyOutput = async (id: string, updates: Partial<WeeklyOutput>) => {
    if (!props.userId) {
      console.log('No user ID for editing weekly output');
      toast.error('Please sign in to edit weekly outputs');
      return;
    }

    console.log('Editing weekly output for user:', props.userId, 'output:', id, 'updates:', updates);

    setLoading(true);
    try {
      if (props.isGoogleSheetsAvailable()) {
        await supabaseDataService.updateWeeklyOutput(id, props.userId, updates);
        await props.loadAllData();
        toast.success('Weekly output updated successfully');
      } else {
        toast.error('Please sign in to edit weekly outputs');
      }
    } catch (error) {
      console.error('Failed to update weekly output for user', props.userId, ':', error);
      toast.error('Failed to update weekly output');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (id: string, progress: number) => {
    if (!props.userId) {
      console.log('No user ID for updating weekly output progress');
      toast.error('Please sign in to update weekly outputs');
      return;
    }

    console.log('Updating weekly output progress for user:', props.userId, 'output:', id, 'progress:', progress);

    setLoading(true);
    try {
      if (props.isGoogleSheetsAvailable()) {
        await supabaseDataService.updateWeeklyOutput(id, props.userId, { progress });
        await props.loadAllData();
        toast.success('Progress updated successfully');
      } else {
        toast.error('Please sign in to update weekly outputs');
      }
    } catch (error) {
      console.error('Failed to update progress for user', props.userId, ':', error);
      toast.error('Failed to update progress');
    } finally {
      setLoading(false);
    }
  };

  const moveWeeklyOutput = async (id: string, newDate: Date) => {
    if (!props.userId) return;

    console.log('Moving weekly output for user:', props.userId, 'output:', id, 'to:', newDate);

    setLoading(true);
    try {
      if (props.isGoogleSheetsAvailable()) {
        await supabaseDataService.updateWeeklyOutput(id, props.userId, { 
          dueDate: newDate, 
          isMoved: true 
        });
        await props.loadAllData();
        toast.success('Weekly output moved successfully');
      } else {
        toast.error('Please sign in to move weekly outputs');
      }
    } catch (error) {
      console.error('Failed to move weekly output for user', props.userId, ':', error);
      toast.error('Failed to move weekly output');
    } finally {
      setLoading(false);
    }
  };

  const deleteWeeklyOutput = async (id: string) => {
    if (!props.userId) return;

    console.log('Soft deleting weekly output for user:', props.userId, 'output:', id);

    setLoading(true);
    try {
      if (props.isGoogleSheetsAvailable()) {
        await supabaseDataService.updateWeeklyOutput(id, props.userId, { 
          isDeleted: true, 
          deletedDate: new Date() 
        });
        await props.loadAllData();
        toast.success('Weekly output deleted');
      } else {
        toast.error('Please sign in to delete weekly outputs');
      }
    } catch (error) {
      console.error('Failed to delete weekly output for user', props.userId, ':', error);
      toast.error('Failed to delete weekly output');
    } finally {
      setLoading(false);
    }
  };

  const restoreWeeklyOutput = async (id: string) => {
    if (!props.userId) return;

    console.log('Restoring weekly output for user:', props.userId, 'output:', id);

    setLoading(true);
    try {
      if (props.isGoogleSheetsAvailable()) {
        await supabaseDataService.updateWeeklyOutput(id, props.userId, { 
          isDeleted: false, 
          deletedDate: undefined 
        });
        await props.loadAllData();
        toast.success('Weekly output restored');
      } else {
        toast.error('Please sign in to restore weekly outputs');
      }
    } catch (error) {
      console.error('Failed to restore weekly output for user', props.userId, ':', error);
      toast.error('Failed to restore weekly output');
    } finally {
      setLoading(false);
    }
  };

  const permanentlyDeleteWeeklyOutput = async (id: string) => {
    if (!props.userId) return;

    console.log('Permanently deleting weekly output for user:', props.userId, 'output:', id);

    setLoading(true);
    try {
      if (props.isGoogleSheetsAvailable()) {
        await supabaseDataService.permanentlyDeleteWeeklyOutput(id, props.userId);
        await props.loadAllData();
        toast.success('Weekly output permanently deleted');
      } else {
        toast.error('Please sign in to delete weekly outputs');
      }
    } catch (error) {
      console.error('Failed to permanently delete weekly output for user', props.userId, ':', error);
      toast.error('Failed to delete weekly output');
    } finally {
      setLoading(false);
    }
  };

  const syncLinkages = () => {
    console.log('Linkage synchronization simplified');
  };

  return {
    weeklyOutputs: props.weeklyOutputs,
    loading,
    addWeeklyOutput,
    editWeeklyOutput,
    updateProgress,
    moveWeeklyOutput,
    deleteWeeklyOutput,
    restoreWeeklyOutput,
    permanentlyDeleteWeeklyOutput,
    syncLinkages,
  };
};
