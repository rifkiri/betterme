
import { googleSheetsService } from '@/services/GoogleSheetsService';
import { WeeklyOutput } from '@/types/productivity';
import { toast } from 'sonner';

interface UseWeeklyOutputsManagerProps {
  userId: string | null;
  isGoogleSheetsAvailable: () => boolean;
  loadAllData: () => Promise<void>;
  weeklyOutputs: WeeklyOutput[];
  setWeeklyOutputs: (outputs: WeeklyOutput[] | ((prev: WeeklyOutput[]) => WeeklyOutput[])) => void;
  deletedWeeklyOutputs: WeeklyOutput[];
  setDeletedWeeklyOutputs: (outputs: WeeklyOutput[] | ((prev: WeeklyOutput[]) => WeeklyOutput[])) => void;
}

export const useWeeklyOutputsManager = ({
  userId,
  isGoogleSheetsAvailable,
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
      id: Date.now().toString(),
      createdDate: new Date(),
    };

    console.log('Adding weekly output:', newOutput);

    try {
      if (isGoogleSheetsAvailable()) {
        console.log('Attempting to save to Google Sheets...');
        await googleSheetsService.addWeeklyOutput({ ...newOutput, userId });
        console.log('Successfully saved to Google Sheets, reloading data...');
        await loadAllData();
        toast.success('Weekly output added successfully');
      } else {
        toast.error('Google Sheets not available');
      }
    } catch (error) {
      console.error('Failed to save weekly output:', error);
      toast.error('Failed to save weekly output: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setWeeklyOutputs(prev => [...prev, newOutput]);
    }
  };

  const editWeeklyOutput = async (id: string, updates: Partial<WeeklyOutput>) => {
    if (!userId) {
      console.error('No user ID found');
      return;
    }

    console.log('Editing weekly output:', { id, updates });

    try {
      if (isGoogleSheetsAvailable()) {
        console.log('Attempting to update in Google Sheets...');
        await googleSheetsService.updateWeeklyOutput(id, userId, updates);
        console.log('Successfully updated in Google Sheets, reloading data...');
        await loadAllData();
        toast.success('Weekly output updated successfully');
      } else {
        toast.error('Google Sheets not available');
      }
    } catch (error) {
      console.error('Failed to update weekly output:', error);
      toast.error('Failed to update weekly output: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setWeeklyOutputs(prev => prev.map(output => 
        output.id === id ? { ...output, ...updates } : output
      ));
    }
  };

  const updateProgress = async (outputId: string, newProgress: number) => {
    if (!userId) return;

    const output = weeklyOutputs.find(o => o.id === outputId);
    if (!output) return;

    const newProgressValue = Math.max(0, Math.min(100, newProgress));
    const updates: Partial<WeeklyOutput> = { progress: newProgressValue };

    if (newProgressValue === 100 && output.progress < 100) {
      updates.completedDate = new Date();
    } else if (newProgressValue < 100 && output.progress === 100) {
      updates.completedDate = undefined;
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
      if (isGoogleSheetsAvailable()) {
        await googleSheetsService.updateWeeklyOutput(id, userId, { isDeleted: true, deletedDate: new Date() });
        await loadAllData();
        toast.success('Weekly output deleted');
      } else {
        toast.error('Google Sheets not available');
      }
    } catch (error) {
      toast.error('Failed to delete weekly output');
      const outputToDelete = weeklyOutputs.find(output => output.id === id);
      if (outputToDelete) {
        setDeletedWeeklyOutputs(prev => [...prev, { ...outputToDelete, isDeleted: true, deletedDate: new Date() }]);
        setWeeklyOutputs(prev => prev.filter(output => output.id !== id));
      }
    }
  };

  const restoreWeeklyOutput = async (id: string) => {
    if (!userId) return;

    try {
      if (isGoogleSheetsAvailable()) {
        await googleSheetsService.updateWeeklyOutput(id, userId, { isDeleted: false, deletedDate: undefined });
        await loadAllData();
        toast.success('Weekly output restored');
      } else {
        toast.error('Google Sheets not available');
      }
    } catch (error) {
      toast.error('Failed to restore weekly output');
      const outputToRestore = deletedWeeklyOutputs.find(output => output.id === id);
      if (outputToRestore) {
        const restoredOutput = { ...outputToRestore, isDeleted: false, deletedDate: undefined };
        setWeeklyOutputs(prev => [...prev, restoredOutput]);
        setDeletedWeeklyOutputs(prev => prev.filter(output => output.id !== id));
      }
    }
  };

  const permanentlyDeleteWeeklyOutput = async (id: string) => {
    setDeletedWeeklyOutputs(prev => prev.filter(output => output.id !== id));
    toast.success('Weekly output permanently deleted');
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
