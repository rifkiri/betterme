import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PomodoroCounterService, PomodoroCountData } from '@/services/PomodoroCounterService';
import { PomodoroSessionManager } from '@/services/PomodoroSessionManager';
import { supabase } from '@/integrations/supabase/client';

export interface UsePomodoroCounterRealtimeResult {
  count: number;
  duration: number;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Real-time Pomodoro counter hook with instant updates
 * Subscribes to database changes for immediate UI updates
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
      const result = await PomodoroCounterService.getTaskCountData(taskId, currentUser.id);
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

  // Real-time subscription
  useEffect(() => {
    if (!taskId || !currentUser?.id) return;

    const channel = supabase
      .channel(`pomodoro-counter-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pomodoro_sessions',
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          // Immediate refetch on any change
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, currentUser?.id, fetchData]);

  return {
    count: data.workSessionCount,
    duration: data.totalDuration,
    isLoading,
    refetch: fetchData,
  };
};