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

  static async getActiveSessionsByUser(userId: string): Promise<ActivePomodoroSession[]> {
    const { data, error } = await supabase
      .from('active_pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .neq('session_status', 'terminated')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ActivePomodoroSession[];
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