
import { supabase } from '@/integrations/supabase/client';
import { Habit } from '@/types/productivity';

export class SupabaseHabitsService {
  async getHabits(userId: string): Promise<Habit[]> {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching habits:', error);
      throw error;
    }

    return data.map(habit => ({
      id: habit.id,
      name: habit.name,
      description: habit.description,
      completed: habit.completed,
      streak: habit.streak,
      category: habit.category,
      archived: habit.archived,
      isDeleted: habit.is_deleted,
      createdAt: habit.created_at
    }));
  }

  async addHabit(habit: Habit & { userId: string }): Promise<void> {
    const { error } = await supabase
      .from('habits')
      .insert({
        user_id: habit.userId,
        name: habit.name,
        description: habit.description,
        completed: habit.completed,
        streak: habit.streak,
        category: habit.category,
        archived: habit.archived,
        is_deleted: habit.isDeleted
      });

    if (error) {
      console.error('Error adding habit:', error);
      throw error;
    }
  }

  async updateHabit(id: string, userId: string, updates: Partial<Habit>): Promise<void> {
    const supabaseUpdates: any = {};
    
    if (updates.name) supabaseUpdates.name = updates.name;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;
    if (updates.completed !== undefined) supabaseUpdates.completed = updates.completed;
    if (updates.streak !== undefined) supabaseUpdates.streak = updates.streak;
    if (updates.category) supabaseUpdates.category = updates.category;
    if (updates.archived !== undefined) supabaseUpdates.archived = updates.archived;
    if (updates.isDeleted !== undefined) supabaseUpdates.is_deleted = updates.isDeleted;

    const { error } = await supabase
      .from('habits')
      .update(supabaseUpdates)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  }
}

export const supabaseHabitsService = new SupabaseHabitsService();
