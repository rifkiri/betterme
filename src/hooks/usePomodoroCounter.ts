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
      const stats = await TaskPomodoroStatsService.getTaskStats(taskId, currentUser.id);
      
      // Set only historical cumulative count (no active session included)
      setCumulativeCount(stats.totalWorkSessions);
      setTotalDuration(stats.totalWorkDuration);
    } catch (error) {
      console.error('Error fetching cumulative pomodoro stats:', error);
      setCumulativeCount(0);
      setTotalDuration(0);
    } finally {
      setLoading(false);
    }
  }, [taskId, currentUser?.id]);

  useEffect(() => {
    fetchCumulativeStats();
  }, [fetchCumulativeStats]);

  // Refetch when active session task changes (not when progress changes)
  useEffect(() => {
    if (activeSession?.task_id !== taskId) {
      fetchCumulativeStats();
    }
  }, [activeSession?.task_id, fetchCumulativeStats, taskId]);

  const currentSessionCount = TaskPomodoroStatsService.getCurrentSessionProgress(activeSession, taskId);

  return {
    cumulativeCount,
    totalDuration,
    currentSessionCount,
    loading,
    refetch: fetchCumulativeStats
  };
};
