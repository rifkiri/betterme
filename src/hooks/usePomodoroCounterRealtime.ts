import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { TaskPomodoroStatsService, PomodoroCountData } from '@/services/TaskPomodoroStatsService';
import { PomodoroSessionManager } from '@/services/PomodoroSessionManager';
import { supabase } from '@/integrations/supabase/client';

export interface UsePomodoroCounterRealtimeResult {
  count: number;
  duration: number;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Real-time Pomodoro counter hook using optimized cumulative stats table
 * Provides instant O(1) lookups and reliable real-time updates
 */
export const usePomodoroCounterRealtime = (taskId?: string): UsePomodoroCounterRealtimeResult => {
  const { currentUser } = useCurrentUser();
  const [data, setData] = useState<PomodoroCountData>({ workSessionCount: 0, totalDuration: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentUser?.id || !taskId) {
      setData({ workSessionCount: 0, totalDuration: 0 });
      return;
    }

    setIsLoading(true);
    try {
      // Use optimized cumulative stats lookup
      const result = await TaskPomodoroStatsService.getTaskCountData(taskId, currentUser.id);
      setData(result);
    } catch (error) {
      console.error('Error fetching pomodoro counter data:', error);
      setData({ workSessionCount: 0, totalDuration: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [taskId, currentUser?.id]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to completion events for instant updates
  useEffect(() => {
    if (!taskId) return;

    const sessionManager = PomodoroSessionManager.getInstance();
    const unsubscribe = sessionManager.subscribeToEvents('session_completed', (event) => {
      if (event.taskId === taskId && event.sessionType === 'work') {
        // Immediate refetch when work session completes for this task
        fetchData();
      }
    });

    return unsubscribe;
  }, [taskId, fetchData]);

  // Real-time subscription to cumulative stats table
  useEffect(() => {
    if (!taskId || !currentUser?.id) return;

    const unsubscribe = TaskPomodoroStatsService.subscribeToTaskChanges(
      taskId, 
      currentUser.id,
      (data) => {
        // Update state with new data from real-time subscription
        setData(data);
      }
    );

    return unsubscribe;
  }, [taskId, currentUser?.id]);

  return {
    count: data.workSessionCount,
    duration: data.totalDuration,
    isLoading,
    refetch: fetchData,
  };
};