import { supabase } from '@/integrations/supabase/client';

export interface TaskPomodoroStats {
  totalWorkSessions: number;
  totalWorkDuration: number; // in minutes
  totalBreakSessions: number;
  totalBreakDuration: number;
  lastSessionDate: Date | null;
}

export interface PomodoroCountData {
  workSessionCount: number;
  totalDuration: number;
}

/**
 * Optimized service using cumulative task_pomodoro_stats table for O(1) queries
 * Replaces slow aggregation-based queries with instant single-record lookups
 */
export class TaskPomodoroStatsService {
  /**
   * Get comprehensive cumulative statistics for a task (O(1) lookup)
   */
  static async getTaskStats(
    taskId: string, 
    userId: string
  ): Promise<TaskPomodoroStats> {
    try {
      // Add debug logging
      console.info('🔍 Fetching task stats from cumulative table:', { taskId, userId });
      
      const { data, error } = await supabase
        .from('task_pomodoro_stats')
        .select('*')
        .eq('task_id', taskId)
        .eq('user_id', userId)
        .single();

      if (error) {
        // No stats record exists yet
        if (error.code === 'PGRST116') {
          return {
            totalWorkSessions: 0,
            totalWorkDuration: 0,
            totalBreakSessions: 0,
            totalBreakDuration: 0,
            lastSessionDate: null
          };
        }
        console.error('Error fetching task Pomodoro stats:', error);
        throw error;
      }

      const result = {
        totalWorkSessions: data.work_sessions_count || 0,
        totalWorkDuration: data.work_duration_total || 0,
        totalBreakSessions: data.break_sessions_count || 0,
        totalBreakDuration: data.break_duration_total || 0,
        lastSessionDate: data.last_work_session_at ? new Date(data.last_work_session_at) : null
      };
      
      console.info('📊 Task stats retrieved:', { taskId, result });
      return result;

    } catch (error) {
      console.error('Error fetching task Pomodoro stats:', error);
      return {
        totalWorkSessions: 0,
        totalWorkDuration: 0,
        totalBreakSessions: 0,
        totalBreakDuration: 0,
        lastSessionDate: null
      };
    }
  }

  /**
   * Batch fetch Pomodoro stats for multiple tasks efficiently (single query)
   */
  static async getBatchTaskStats(taskIds: string[]): Promise<Map<string, PomodoroCountData>> {
    const result = new Map<string, PomodoroCountData>();
    
    if (taskIds.length === 0) {
      return result;
    }

    try {
      const { data, error } = await supabase
        .from('task_pomodoro_stats')
        .select('task_id, work_sessions_count, work_duration_total')
        .in('task_id', taskIds);

      if (error) {
        console.error('Error batch fetching task Pomodoro stats:', error);
        return result;
      }

      // Populate map with fetched data
      for (const stat of data || []) {
        result.set(stat.task_id, {
          workSessionCount: stat.work_sessions_count || 0,
          totalDuration: stat.work_duration_total || 0
        });
      }

      // Fill in missing tasks with zero values
      for (const taskId of taskIds) {
        if (!result.has(taskId)) {
          result.set(taskId, { workSessionCount: 0, totalDuration: 0 });
        }
      }

      return result;
    } catch (error) {
      console.error('Error in getBatchTaskStats:', error);
      return result;
    }
  }

  /**
   * Get work session count and total duration for a task (O(1) lookup)
   */
  static async getTaskCountData(taskId: string, userId: string): Promise<PomodoroCountData> {
    try {
      const stats = await this.getTaskStats(taskId, userId);
      return {
        workSessionCount: stats.totalWorkSessions,
        totalDuration: stats.totalWorkDuration
      };
    } catch (error) {
      console.error('Error in getTaskCountData:', error);
      return { workSessionCount: 0, totalDuration: 0 };
    }
  }

  /**
   * Get cumulative work session count for a task (O(1) lookup)
   */
  static async getCumulativeWorkCount(
    taskId: string, 
    userId: string
  ): Promise<number> {
    const stats = await this.getTaskStats(taskId, userId);
    return stats.totalWorkSessions;
  }

  /**
   * Get current active session progress for a task
   * Active sessions are not counted until completion
   */
  static getCurrentSessionProgress(activeSession: any, taskId: string): number {
    // Sessions are only counted once they are completed and saved to the database
    // Active sessions should not contribute to the count until completion
    return 0;
  }

  /**
   * Get next pomodoro number for a new session
   */
  static async getNextPomodoroNumber(taskId: string, userId: string): Promise<number> {
    try {
      const stats = await this.getTaskStats(taskId, userId);
      return stats.totalWorkSessions + 1;
    } catch (error) {
      console.error('Error getting next pomodoro number:', error);
      return 1;
    }
  }

  /**
   * Format duration in a user-friendly way
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
   * Subscribe to real-time changes for task pomodoro stats
   */
  static subscribeToTaskChanges(taskId: string, userId: string, callback: (data: PomodoroCountData) => void) {
    const channel = supabase
      .channel(`task-pomodoro-stats-${taskId}-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_pomodoro_stats',
          filter: `task_id=eq.${taskId}`,
        },
        async () => {
          // Fetch latest data when changes occur
          const data = await this.getTaskCountData(taskId, userId);
          callback(data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
}