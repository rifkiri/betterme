import { supabase } from '@/integrations/supabase/client';

export interface ActivePomodoroSession {
  id: string;
  user_id: string;
  task_id?: string;
  session_id: string;
  task_title?: string;
  session_status: 'active-stopped' | 'active-running' | 'active-paused' | 'terminated';
  current_session_type: 'work' | 'short_break' | 'long_break';
  work_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  sessions_until_long_break: number;
  completed_work_sessions: number;
  completed_break_sessions: number;
  current_start_time?: string;
  current_pause_time?: string;
  current_time_remaining?: number;
  is_card_visible: boolean;
  is_floating_visible: boolean;
  created_at: string;
  updated_at: string;
}

export class SupabaseActivePomodoroService {
  static async createActiveSession(session: Omit<ActivePomodoroSession, 'id' | 'created_at' | 'updated_at'>): Promise<ActivePomodoroSession> {
    const { data, error } = await supabase
      .from('active_pomodoro_sessions')
      .insert(session)
      .select()
      .single();

    if (error) throw error;
    return data as ActivePomodoroSession;
  }

  static async getActiveSessionsByUser(userId: string, maxAgeHours: number = 48): Promise<ActivePomodoroSession[]> {
    const { data, error } = await supabase
      .from('active_pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .neq('session_status', 'terminated')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    
    const sessions = (data || []) as ActivePomodoroSession[];
    
    // Filter out stale sessions based on age
    return sessions.filter(session => !this.isSessionStale(session, maxAgeHours));
  }

  static async cleanupStaleSessionsForUser(userId: string, maxAgeHours: number = 24): Promise<number> {
    const { data, error } = await supabase
      .from('active_pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .neq('session_status', 'terminated');

    if (error) {
      console.error('Error fetching sessions for cleanup:', error);
      return 0;
    }

    const sessions = (data || []) as ActivePomodoroSession[];
    const staleSessions = sessions.filter(session => this.isSessionStale(session, maxAgeHours));
    
    if (staleSessions.length === 0) {
      return 0;
    }

    // Batch terminate stale sessions
    const { error: updateError } = await supabase
      .from('active_pomodoro_sessions')
      .update({ 
        session_status: 'terminated',
        current_start_time: null,
        current_pause_time: null,
        current_time_remaining: null
      })
      .in('id', staleSessions.map(s => s.id));

    if (updateError) {
      console.error('Error cleaning up stale sessions:', updateError);
      return 0;
    }

    console.log(`Cleaned up ${staleSessions.length} stale Pomodoro sessions`);
    return staleSessions.length;
  }

  static isSessionStale(session: ActivePomodoroSession, maxAgeHours: number = 24): boolean {
    const now = new Date();
    
    // For paused sessions, check pause time
    if (session.session_status === 'active-paused' && session.current_pause_time) {
      const pauseTime = new Date(session.current_pause_time);
      const hoursSincePause = (now.getTime() - pauseTime.getTime()) / (1000 * 60 * 60);
      return hoursSincePause > maxAgeHours;
    }
    
    // For stopped sessions, check updated_at
    if (session.session_status === 'active-stopped') {
      const updatedAt = new Date(session.updated_at);
      const hoursSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
      return hoursSinceUpdate > maxAgeHours;
    }
    
    return false;
  }

  static calculateSessionAge(session: ActivePomodoroSession): number {
    const now = new Date();
    
    if (session.session_status === 'active-paused' && session.current_pause_time) {
      const pauseTime = new Date(session.current_pause_time);
      return (now.getTime() - pauseTime.getTime()) / (1000 * 60 * 60);
    }
    
    const updatedAt = new Date(session.updated_at);
    return (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
  }

  static async getActiveSessionByTask(taskId: string, userId: string): Promise<ActivePomodoroSession | null> {
    const { data, error } = await supabase
      .from('active_pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .neq('session_status', 'terminated')
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return (data || null) as ActivePomodoroSession | null;
  }

  static async updateActiveSession(id: string, updates: Partial<ActivePomodoroSession>): Promise<ActivePomodoroSession> {
    // Validate time remaining is not negative before saving
    if (updates.current_time_remaining !== undefined && updates.current_time_remaining !== null) {
      updates.current_time_remaining = Math.max(0, updates.current_time_remaining);
    }

    const { data, error } = await supabase
      .from('active_pomodoro_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ActivePomodoroSession;
  }

  static async terminateSession(id: string): Promise<void> {
    const { error } = await supabase
      .from('active_pomodoro_sessions')
      .update({ 
        session_status: 'terminated',
        current_start_time: null,
        current_pause_time: null,
        current_time_remaining: null
      })
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteActiveSession(id: string): Promise<void> {
    const { error } = await supabase
      .from('active_pomodoro_sessions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async updateSettings(
    id: string, 
    settings: {
      work_duration?: number;
      short_break_duration?: number;
      long_break_duration?: number;
      sessions_until_long_break?: number;
    }
  ): Promise<ActivePomodoroSession> {
    const { data, error } = await supabase
      .from('active_pomodoro_sessions')
      .update(settings)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ActivePomodoroSession;
  }
}