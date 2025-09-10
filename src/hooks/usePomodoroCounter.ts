import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { TaskPomodoroStatsService } from '@/services/TaskPomodoroStatsService';
import { usePomodoroSessionManager } from '@/hooks/usePomodoroSessionManager';

export interface PomodoroCounterData {
  cumulativeCount: number;        // Total work sessions for task
  totalDuration: number;          // Total work time in minutes  
  currentSessionCount: number;    // Current active session progress
  loading: boolean;
  refetch: () => void;
}

export const usePomodoroCounter = (taskId?: string): PomodoroCounterData => {
  const { currentUser } = useCurrentUser();
  const { activeSession } = usePomodoroSessionManager();
  const [cumulativeCount, setCumulativeCount] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCumulativeStats = useCallback(async () => {
    if (!currentUser?.id || !taskId) return;
    
    setLoading(true);
    try {
      const stats = await TaskPomodoroStatsService.getTaskStats(
        taskId, 
        currentUser.id, 
        activeSession
      );
      
      // Set cumulative count (historical + current active session progress)
      setCumulativeCount(stats.totalWorkSessions + stats.currentSessionProgress);
      setTotalDuration(stats.totalWorkDuration);
    } catch (error) {
      console.error('Error fetching cumulative pomodoro stats:', error);
      setCumulativeCount(0);
      setTotalDuration(0);
    } finally {
      setLoading(false);
    }
  }, [taskId, currentUser?.id, activeSession?.completed_work_sessions]);

  useEffect(() => {
    fetchCumulativeStats();
  }, [fetchCumulativeStats]);

  // Refetch when active session changes or completes
  useEffect(() => {
    fetchCumulativeStats();
  }, [activeSession?.task_id, activeSession?.completed_work_sessions, fetchCumulativeStats]);

  const currentSessionCount = (activeSession?.task_id === taskId) 
    ? activeSession.completed_work_sessions || 0 
    : 0;

  return {
    cumulativeCount,
    totalDuration,
    currentSessionCount,
    loading,
    refetch: fetchCumulativeStats
  };
};
