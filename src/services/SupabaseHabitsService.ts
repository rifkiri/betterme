import { supabase } from '@/integrations/supabase/client';
import { Habit } from '@/types/productivity';
import { format } from 'date-fns';

export class SupabaseHabitsService {
  private mapAppCategoryToDatabase(appCategory?: string): 'health' | 'productivity' | 'personal' | 'fitness' | 'learning' | 'other' {
    if (!appCategory) return 'other';
    
    const validCategories = ['health', 'productivity', 'personal', 'fitness', 'learning', 'other'] as const;
    const lowerCategory = appCategory.toLowerCase();
    
    if (validCategories.includes(lowerCategory as any)) {
      return lowerCategory as 'health' | 'productivity' | 'personal' | 'fitness' | 'learning' | 'other';
    }
    
    return 'other';
  }

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
      createdAt: habit.created_at,
      lastCompletedDate: habit.last_completed_date
    }));
  }

  async getHabitsForDate(userId: string, date: Date): Promise<Habit[]> {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Get all habits and their completion records for the specific date
    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select(`
        *,
        habit_completions!left(completed_date)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (habitsError) {
      console.error('Error fetching habits for date:', habitsError);
      throw habitsError;
    }

    return habitsData.map(habit => {
      // Check if habit was completed on the selected date
      const completedOnDate = habit.habit_completions?.some(
        (completion: any) => completion.completed_date === dateStr
      ) || false;

      return {
        id: habit.id,
        name: habit.name,
        description: habit.description,
        completed: completedOnDate,
        streak: habit.streak,
        category: habit.category,
        archived: habit.archived,
        isDeleted: habit.is_deleted,
        createdAt: habit.created_at,
        lastCompletedDate: habit.last_completed_date
      };
    });
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
        category: this.mapAppCategoryToDatabase(habit.category),
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
    if (updates.category) supabaseUpdates.category = this.mapAppCategoryToDatabase(updates.category);
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

  async toggleHabitForDate(habitId: string, userId: string, date: Date, completed: boolean): Promise<void> {
    const dateStr = format(date, 'yyyy-MM-dd');

    if (completed) {
      // Add completion record
      const { error } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: habitId,
          user_id: userId,
          completed_date: dateStr
        });

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        console.error('Error adding habit completion:', error);
        throw error;
      }
    } else {
      // Remove completion record
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .eq('completed_date', dateStr);

      if (error) {
        console.error('Error removing habit completion:', error);
        throw error;
      }
    }
  }
}

export const supabaseHabitsService = new SupabaseHabitsService();
