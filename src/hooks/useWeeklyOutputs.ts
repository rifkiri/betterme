
import { useState } from 'react';
import { WeeklyOutput } from '@/types/productivity';

export const useWeeklyOutputs = () => {
  const [weeklyOutputs, setWeeklyOutputs] = useState<WeeklyOutput[]>([
    { id: '1', title: "Complete Q4 project proposal and presentation", progress: 75, createdDate: new Date() },
    { id: '2', title: "Finish client onboarding documentation", progress: 40, createdDate: new Date() },
    { id: '3', title: "Conduct 3 team performance reviews", progress: 100, createdDate: new Date() },
    { id: '4', title: "Launch marketing campaign for new product feature", progress: 20, createdDate: new Date() }
  ]);

  const [deletedWeeklyOutputs, setDeletedWeeklyOutputs] = useState<WeeklyOutput[]>([]);

  const addWeeklyOutput = (output: Omit<WeeklyOutput, 'id' | 'createdDate'>) => {
    const newOutput: WeeklyOutput = {
      ...output,
      id: Date.now().toString(),
      createdDate: new Date(),
    };
    setWeeklyOutputs(prev => [...prev, newOutput]);
  };

  const updateProgress = (outputId: string, newProgress: number) => {
    setWeeklyOutputs(prev => prev.map(output => 
      output.id === outputId ? { ...output, progress: Math.max(0, Math.min(100, newProgress)) } : output
    ));
  };

  const deleteWeeklyOutput = (id: string) => {
    const outputToDelete = weeklyOutputs.find(output => output.id === id);
    if (outputToDelete) {
      setDeletedWeeklyOutputs(prev => [...prev, { ...outputToDelete, isDeleted: true, deletedDate: new Date() }]);
      setWeeklyOutputs(prev => prev.filter(output => output.id !== id));
    }
  };

  const restoreWeeklyOutput = (id: string) => {
    const outputToRestore = deletedWeeklyOutputs.find(output => output.id === id);
    if (outputToRestore) {
      setWeeklyOutputs(prev => [...prev, { ...outputToRestore, isDeleted: false, deletedDate: undefined }]);
      setDeletedWeeklyOutputs(prev => prev.filter(output => output.id !== id));
    }
  };

  const permanentlyDeleteWeeklyOutput = (id: string) => {
    setDeletedWeeklyOutputs(prev => prev.filter(output => output.id !== id));
  };

  return {
    weeklyOutputs,
    deletedWeeklyOutputs,
    addWeeklyOutput,
    updateProgress,
    deleteWeeklyOutput,
    restoreWeeklyOutput,
    permanentlyDeleteWeeklyOutput,
  };
};
