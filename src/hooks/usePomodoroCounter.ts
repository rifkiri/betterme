import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { SupabasePomodoroService } from '@/services/SupabasePomodoroService';
import { usePomodoroSessionManager } from '@/hooks/usePomodoroSessionManager';

export const usePomodoroCounter = (taskId?: string) => {
  const { currentUser } = useCurrentUser();
  const { activeSession } = usePomodoroSessionManager();
  const [historicalCount, setHistoricalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Determine if we should use active session counter or historical counter
  const getAuthoritativeCount = useCallback(() => {
    // If there's an active session for this task, use its counter
    if (activeSession?.task_id === taskId && activeSession.completed_work_sessions > 0) {
      return activeSession.completed_work_sessions;
    }
    
    // Otherwise, use historical count
    return historicalCount;
  }, [activeSession, taskId, historicalCount]);

  const fetchHistoricalCount = useCallback(async () => {
    if (!currentUser?.id || !taskId) return;
    
    setLoading(true);
    try {
      const sessions = await SupabasePomodoroService.getSessionsByTask(taskId, currentUser.id);
      const completedWorkSessions = sessions.filter(s => 
        s.session_type === 'work' && 
        !s.interrupted &&
        s.session_status === 'completed'
      );
      setHistoricalCount(completedWorkSessions.length);
    } catch (error) {
      console.error('Error fetching pomodoro count:', error);
      setHistoricalCount(0);
    } finally {
      setLoading(false);
    }
  }, [taskId, currentUser?.id]);

  useEffect(() => {
    fetchHistoricalCount();
  }, [fetchHistoricalCount]);

  // Only refetch historical count when session completes and gets saved to history
  useEffect(() => {
    // Only refetch if no active session for this task (meaning it was terminated/completed)
    if (!activeSession || activeSession.task_id !== taskId) {
      fetchHistoricalCount();
    }
  }, [activeSession?.task_id, taskId, fetchHistoricalCount]);

  return {
    count: getAuthoritativeCount(),
    loading,
    refetch: fetchHistoricalCount
  };
};
