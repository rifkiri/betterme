import { SupabasePomodoroService } from './SupabasePomodoroService';

export interface TaskPomodoroStats {
  totalWorkSessions: number;
  totalWorkDuration: number; // in minutes
  totalBreakSessions: number;
  totalBreakDuration: number;
  currentSessionProgress: number; // from active session
  lastSessionDate: Date | null;
}

export class TaskPomodoroStatsService {
  /**
   * Get comprehensive cumulative statistics for a task
   */
  static async getTaskStats(
    taskId: string, 
    userId: string, 
    activeSession?: any
  ): Promise<TaskPomodoroStats> {
    try {
      // Get all historical sessions for the task
      const sessions = await SupabasePomodoroService.getSessionsByTask(taskId, userId);
      
      // Calculate totals from historical sessions
      const workSessions = sessions.filter(s => 
        s.session_type === 'work' && 
        s.session_status === 'completed' && 
        !s.interrupted
      );
      
      const breakSessions = sessions.filter(s => 
        (s.session_type === 'short_break' || s.session_type === 'long_break') && 
        s.session_status === 'completed' && 
        !s.interrupted
      );

      const totalWorkSessions = workSessions.length;
      const totalWorkDuration = workSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
      const totalBreakSessions = breakSessions.length;
      const totalBreakDuration = breakSessions.reduce((sum, s) => sum + s.duration_minutes, 0);

      // Get last session date
      const lastSessionDate = sessions.length > 0 
        ? new Date(sessions[0].completed_at) // sessions are ordered by completion date desc
        : null;

      return {
        totalWorkSessions,
        totalWorkDuration,
        totalBreakSessions,
        totalBreakDuration,
        currentSessionProgress: 0, // Remove active session from historical stats
        lastSessionDate
      };

    } catch (error) {
      console.error('Error fetching task Pomodoro stats:', error);
      return {
        totalWorkSessions: 0,
        totalWorkDuration: 0,
        totalBreakSessions: 0,
        totalBreakDuration: 0,
        currentSessionProgress: 0,
        lastSessionDate: null
      };
    }
  }

  /**
   * Get cumulative work session count for a task (historical only)
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
   */
  static getCurrentSessionProgress(activeSession: any, taskId: string): number {
    return (activeSession?.task_id === taskId && activeSession?.completed_work_sessions > 0) 
      ? activeSession.completed_work_sessions 
      : 0;
  }

  /**
   * Get next pomodoro number for a new session
   */
  static async getNextPomodoroNumber(taskId: string, userId: string): Promise<number> {
    try {
      const sessions = await SupabasePomodoroService.getSessionsByTask(taskId, userId);
      const workSessions = sessions.filter(s => 
        s.session_type === 'work' && 
        s.session_status === 'completed' && 
        !s.interrupted
      );
      return workSessions.length + 1;
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
}