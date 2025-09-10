import { supabase } from '@/integrations/supabase/client';

export interface PomodoroCountData {
  workSessionCount: number;
  totalDuration: number;
}

/**
 * Centralized service for Pomodoro counting with real-time capabilities
 * Single source of truth for all counter logic
 */
export class PomodoroCounterService {
  /**
   * Get work session count and total duration for a task
   * Simple, direct database query - no complex filtering
   */
  static async getTaskCountData(taskId: string, userId: string): Promise<PomodoroCountData> {
    try {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('duration_minutes')
        .eq('task_id', taskId)
        .eq('user_id', userId)
        .eq('session_type', 'work')
        .eq('session_status', 'completed')
        .eq('interrupted', false);

      if (error) {
        console.error('Error fetching pomodoro count data:', error);
        return { workSessionCount: 0, totalDuration: 0 };
      }

      const workSessionCount = data?.length || 0;
      const totalDuration = data?.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) || 0;

      return { workSessionCount, totalDuration };
    } catch (error) {
      console.error('Error in getTaskCountData:', error);
      return { workSessionCount: 0, totalDuration: 0 };
    }
  }

  /**
   * Get work session count for a task (quick query)
   */
  static async getWorkSessionCount(taskId: string, userId: string): Promise<number> {
    const data = await this.getTaskCountData(taskId, userId);
    return data.workSessionCount;
  }

  /**
   * Get total duration for a task (quick query)
   */
  static async getTotalDuration(taskId: string, userId: string): Promise<number> {
    const data = await this.getTaskCountData(taskId, userId);
    return data.totalDuration;
  }

  /**
   * Format duration in user-friendly format
   */
  static formatDuration(minutes: number): string {
    if (minutes === 0) return '0m';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  /**
   * Subscribe to real-time changes for pomodoro sessions
   */
  static subscribeToTaskChanges(taskId: string, callback: (data: PomodoroCountData) => void) {
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
          // Re-fetch data when changes occur
          // We'll get userId from the callback context
          callback({ workSessionCount: 0, totalDuration: 0 }); // Trigger refetch
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}