
import { useState } from 'react';
import { WeeklyOutput } from '@/types/productivity';
import { startOfWeek, addDays, subWeeks } from 'date-fns';
import { isWeeklyOutputOverdue } from '@/utils/dateUtils';

export const useWeeklyOutputs = () => {
  // Get current week start (Monday)
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(currentWeekStart, 1);
  const twoWeeksAgoStart = subWeeks(currentWeekStart, 2);
  
  const [weeklyOutputs, setWeeklyOutputs] = useState<WeeklyOutput[]>([
    { 
      id: '1', 
      title: "Complete Q4 project proposal and presentation", 
      progress: 75, 
      createdDate: new Date(), 
      dueDate: addDays(currentWeekStart, 4) // Friday of current week
    },
    { 
      id: '2', 
      title: "Finish client onboarding documentation", 
      progress: 40, 
      createdDate: new Date(), 
      dueDate: addDays(currentWeekStart, 2) // Wednesday of current week
    },
    { 
      id: '3', 
      title: "Conduct 3 team performance reviews", 
      progress: 100, 
      createdDate: new Date(), 
      dueDate: addDays(currentWeekStart, 1) // Tuesday of current week
    },
    { 
      id: '4', 
      title: "Launch marketing campaign for new product feature", 
      progress: 20, 
      createdDate: new Date(), 
      dueDate: addDays(currentWeekStart, 6) // Sunday of current week
    },
    // Previous week overdue examples
    { 
      id: '5', 
      title: "Complete quarterly budget analysis and report", 
      progress: 60, 
      createdDate: subWeeks(new Date(), 1), 
      dueDate: addDays(lastWeekStart, 4) // Friday of last week - overdue
    },
    { 
      id: '6', 
      title: "Finalize vendor contract negotiations", 
      progress: 30, 
      createdDate: subWeeks(new Date(), 1), 
      dueDate: addDays(lastWeekStart, 2) // Wednesday of last week - overdue
    },
    // Two weeks ago overdue examples
    { 
      id: '7', 
      title: "Update employee handbook with new policies", 
      progress: 85, 
      createdDate: subWeeks(new Date(), 2), 
      dueDate: addDays(twoWeeksAgoStart, 3) // Thursday two weeks ago - overdue
    },
    { 
      id: '8', 
      title: "Complete annual compliance audit checklist", 
      progress: 45, 
      createdDate: subWeeks(new Date(), 2), 
      dueDate: addDays(twoWeeksAgoStart, 1) // Tuesday two weeks ago - overdue
    }
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

  const editWeeklyOutput = (id: string, updates: Partial<WeeklyOutput>) => {
    setWeeklyOutputs(prev => prev.map(output => 
      output.id === id ? { ...output, ...updates } : output
    ));
  };

  const updateProgress = (outputId: string, newProgress: number) => {
    setWeeklyOutputs(prev => prev.map(output => 
      output.id === outputId ? { ...output, progress: Math.max(0, Math.min(100, newProgress)) } : output
    ));
  };

  const moveWeeklyOutput = (id: string, newDueDate: Date) => {
    setWeeklyOutputs(prev => prev.map(output => 
      output.id === id ? { 
        ...output, 
        dueDate: newDueDate,
        originalDueDate: output.originalDueDate || output.dueDate,
        isMoved: true
      } : output
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

  const getOverdueWeeklyOutputs = () => {
    return weeklyOutputs.filter(output => 
      output.dueDate && isWeeklyOutputOverdue(output.dueDate, output.progress)
    );
  };

  return {
    weeklyOutputs,
    deletedWeeklyOutputs,
    addWeeklyOutput,
    editWeeklyOutput,
    updateProgress,
    moveWeeklyOutput,
    deleteWeeklyOutput,
    restoreWeeklyOutput,
    permanentlyDeleteWeeklyOutput,
    getOverdueWeeklyOutputs,
  };
};
