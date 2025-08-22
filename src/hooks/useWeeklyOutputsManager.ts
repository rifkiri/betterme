import { useState, useEffect } from 'react';
import { DataService } from '@/services/DataService';
import { WeeklyOutput } from '@/types/productivity';
import { toast } from 'sonner';
import { useDataStore } from '@/stores/dataStore';

export const useWeeklyOutputsManager = () => {
  const [weeklyOutputs, setWeeklyOutputs] = useState<WeeklyOutput[]>([]);
  const [loading, setLoading] = useState(false);
  const { addWeeklyOutput, updateWeeklyOutput, removeWeeklyOutput } = useDataStore();

  // Remove any linkage synchronization calls and replace with console logs for now
  const syncLinkages = () => {
    console.log('Linkage synchronization simplified');
  };
  
  return {
    weeklyOutputs,
    loading,
    syncLinkages,
  };
};
