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
      // Use new O(1) cumulative stats lookup
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

  // Refetch when work sessions complete for current task
  useEffect(() => {
    if (activeSession?.task_id === taskId && activeSession?.completed_work_sessions) {
      console.info('🔄 Active session work count changed, refetching stats:', { 
        taskId, 
        completedWorkSessions: activeSession.completed_work_sessions 
      });
      // Immediate refetch to sync with database
      const timeoutId = setTimeout(() => {
        fetchCumulativeStats();
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [activeSession?.completed_work_sessions, activeSession?.task_id, taskId, fetchCumulativeStats]);

  const currentSessionCount = TaskPomodoroStatsService.getCurrentSessionProgress(activeSession, taskId);

  return {
    cumulativeCount,
    totalDuration,
    currentSessionCount,
    loading,
    refetch: fetchCumulativeStats
  };
};