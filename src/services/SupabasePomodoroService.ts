import { supabase } from '@/integrations/supabase/client';

export interface PomodoroSessionRecord {
  id?: string;
  user_id: string;
  task_id?: string;
  session_id?: string;
  duration_minutes: number;
  session_type: 'work' | 'short_break' | 'long_break';
  session_status?: 'active' | 'paused' | 'stopped' | 'completed';
  pomodoro_number?: number;
  break_number?: number;
  completed_at?: string;
  interrupted?: boolean;
}

export class SupabasePomodoroService {
  static async saveSession(session: Omit<PomodoroSessionRecord, 'id'>): Promise<void> {
    const { error } = await supabase
      .from('pomodoro_sessions')
      .insert(session);

    if (error) {
      console.error('Error saving pomodoro session:', error);
      throw error;
    }
  }

  static async getSessionsByTask(taskId: string, userId: string): Promise<PomodoroSessionRecord[]> {
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching pomodoro sessions:', error);
      return [];
    }

    return (data || []).map(item => ({
      ...item,
      session_type: item.session_type as 'work' | 'short_break' | 'long_break',
      session_status: item.session_status as 'active' | 'paused' | 'stopped' | 'completed'
    })) as PomodoroSessionRecord[];
  }

  static async getSessionsByUser(userId: string, startDate?: Date, endDate?: Date): Promise<PomodoroSessionRecord[]> {
    let query = supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('completed_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('completed_at', endDate.toISOString());
    }

    const { data, error } = await query.order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching user pomodoro sessions:', error);
      return [];
    }

    return (data || []).map(item => ({
      ...item,
      session_type: item.session_type as 'work' | 'short_break' | 'long_break',
      session_status: item.session_status as 'active' | 'paused' | 'stopped' | 'completed'
    })) as PomodoroSessionRecord[];
  }

  static async getTodaySessionCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { count, error } = await supabase
      .from('pomodoro_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('session_type', 'work')
      .eq('interrupted', false)
      .gte('completed_at', today.toISOString())
      .lt('completed_at', tomorrow.toISOString());

    if (error) {
      console.error('Error fetching today session count:', error);
      return 0;
    }

    return count || 0;
  }
}