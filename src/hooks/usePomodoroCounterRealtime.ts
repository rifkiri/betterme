import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { TaskPomodoroStatsService, PomodoroCountData } from '@/services/TaskPomodoroStatsService';
import { PomodoroSessionManager } from '@/services/PomodoroSessionManager';

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
      console.info('📊 Counter data fetched:', { taskId, result });
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

  // Subscribe to completion events for immediate updates
  useEffect(() => {
    if (!taskId) return;

    const sessionManager = PomodoroSessionManager.getInstance();
    const unsubscribe = sessionManager.subscribeToEvents('session_completed', (event) => {
      if (event.taskId === taskId && event.sessionType === 'work') {
        console.info('🔄 Session completed event received, refetching counter data:', { 
          taskId, 
          eventDuration: event.duration,
          eventPomodoroNumber: event.pomodoroNumber 
        });
        // Immediate refetch when work session completes for this task
        setTimeout(() => fetchData(), 100); // Small delay to ensure database is updated
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
      (newData) => {
        // Update state with new data from real-time subscription
        console.info('🔄 Real-time stats update received:', { taskId, newData });
        setData(newData);
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