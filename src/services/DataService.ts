
import { supabase } from '@/integrations/supabase/client';
import type { Goal, Task, WeeklyOutput, Habit } from '@/types/productivity';
import { toast } from 'sonner';
import {
  transformGoalRow,
  transformGoalToRow,
  transformTaskRow,
  transformTaskToRow,
  transformWeeklyOutputRow,
  transformWeeklyOutputToRow,
  transformHabitRow,
  transformHabitToRow,
} from '@/utils/typeTransformers';

export class DataService {
  // Goals
  static async getGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_date', { ascending: false });
    
    if (error) throw error;
    return data.map(transformGoalRow);
  }

  static async createGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .insert(transformGoalToRow(goal))
      .select()
      .single();
    
    if (error) throw error;
    return transformGoalRow(data);
  }

  static async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .update(transformGoalToRow(updates))
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return transformGoalRow(data);
  }

  static async deleteGoal(id: string): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .update({ is_deleted: true, deleted_date: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  }

  // Tasks
  static async getTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_date', { ascending: false });
    
    if (error) throw error;
    return data.map(transformTaskRow);
  }

  static async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(transformTaskToRow(task))
      .select()
      .single();
    
    if (error) throw error;
    return transformTaskRow(data);
  }

  static async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(transformTaskToRow(updates))
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return transformTaskRow(data);
  }

  static async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({ is_deleted: true, deleted_date: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  }

  // Weekly Outputs
  static async getWeeklyOutputs(userId: string): Promise<WeeklyOutput[]> {
    const { data, error } = await supabase
      .from('weekly_outputs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_date', { ascending: false });
    
    if (error) throw error;
    return data.map(transformWeeklyOutputRow);
  }

  static async createWeeklyOutput(output: Omit<WeeklyOutput, 'id'>): Promise<WeeklyOutput> {
    const { data, error } = await supabase
      .from('weekly_outputs')
      .insert(transformWeeklyOutputToRow(output))
      .select()
      .single();
    
    if (error) throw error;
    return transformWeeklyOutputRow(data);
  }

  static async updateWeeklyOutput(id: string, updates: Partial<WeeklyOutput>): Promise<WeeklyOutput> {
    const { data, error } = await supabase
      .from('weekly_outputs')
      .update(transformWeeklyOutputToRow(updates))
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return transformWeeklyOutputRow(data);
  }

  static async deleteWeeklyOutput(id: string): Promise<void> {
    const { error } = await supabase
      .from('weekly_outputs')
      .update({ is_deleted: true, deleted_date: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  }

  // Habits
  static async getHabits(userId: string): Promise<Habit[]> {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .eq('archived', false)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(transformHabitRow);
  }

  static async createHabit(habit: Omit<Habit, 'id'>): Promise<Habit> {
    const { data, error } = await supabase
      .from('habits')
      .insert(transformHabitToRow(habit))
      .select()
      .single();
    
    if (error) throw error;
    return transformHabitRow(data);
  }

  static async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    const { data, error } = await supabase
      .from('habits')
      .update(transformHabitToRow(updates))
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return transformHabitRow(data);
  }

  static async deleteHabit(id: string): Promise<void> {
    const { error } = await supabase
      .from('habits')
      .update({ is_deleted: true })
      .eq('id', id);
    
    if (error) throw error;
  }

  // Batch operations for better performance
  static async batchUpdate<T>(
    table: string,
    updates: Array<{ id: string; data: Partial<T> }>
  ): Promise<void> {
    const promises = updates.map(({ id, data }) =>
      supabase.from(table).update(data).eq('id', id)
    );
    
    const results = await Promise.allSettled(promises);
    const errors = results.filter(r => r.status === 'rejected');
    
    if (errors.length > 0) {
      console.error('Batch update errors:', errors);
      toast.error(`Failed to update ${errors.length} items`);
    }
  }
}
