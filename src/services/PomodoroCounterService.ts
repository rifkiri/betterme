import { supabase } from '@/integrations/supabase/client';
import { TaskPomodoroStatsService } from '@/services/TaskPomodoroStatsService';

export interface PomodoroCountData {
  workSessionCount: number;
  totalDuration: number;
}

/**
 * Optimized Pomodoro counter service using cumulative stats table
 * Provides O(1) lookups instead of slow aggregation queries
 */
export class PomodoroCounterService {
  /**
   * Get work session count and total duration for a task
   * Now uses optimized cumulative stats table for instant results
   */
  static async getTaskCountData(taskId: string, userId: string): Promise<PomodoroCountData> {
    return TaskPomodoroStatsService.getTaskCountData(taskId, userId);
  }

  /**
   * Get work session count for a task (quick query)
   */
  static async getWorkSessionCount(taskId: string, userId: string): Promise<number> {
    return TaskPomodoroStatsService.getWorkSessionCount(taskId, userId);
  }

  /**
   * Get total duration for a task (quick query)
   */
  static async getTotalDuration(taskId: string, userId: string): Promise<number> {
    return TaskPomodoroStatsService.getTotalDuration(taskId, userId);
  }

  /**
   * Format duration in user-friendly format
   */
  static formatDuration(minutes: number): string {
    return TaskPomodoroStatsService.formatDuration(minutes);
  }

  /**
   * Subscribe to real-time changes for task pomodoro stats
   * Now uses optimized cumulative stats table subscriptions
   */
  static subscribeToTaskChanges(taskId: string, userId: string, callback: (data: PomodoroCountData) => void) {
    return TaskPomodoroStatsService.subscribeToTaskChanges(taskId, userId, callback);
  }
}