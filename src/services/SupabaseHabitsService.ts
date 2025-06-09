
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
      createdAt: habit.created_at
    }));
  }

  async getHabitsForDate(userId: string, date: Date): Promise<Habit[]> {
    const dateStr = format(date, 'yyyy-MM-dd');
    console.log('Getting habits for date:', dateStr, 'user:', userId);
    
    // First get all habits for the user
    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (habitsError) {
      console.error('Error fetching habits for date:', habitsError);
      throw habitsError;
    }

    // Then get completions for the specific date using raw SQL query to avoid TypeScript issues
    const { data: completionsData, error: completionsError } = await supabase
      .rpc('get_habit_completions_for_date', {
        p_user_id: userId,
        p_date: dateStr
      });

    if (completionsError) {
      console.log('No completions found or table doesn\'t exist yet:', completionsError);
      // If the function doesn't exist or there's an error, fall back to basic habits
      return habitsData.map(habit => ({
        id: habit.id,
        name: habit.name,
        description: habit.description,
        completed: false, // Default to not completed if we can't check
        streak: habit.streak,
        category: habit.category,
        archived: habit.archived,
        isDeleted: habit.is_deleted,
        createdAt: habit.created_at
      }));
    }

    // Create a set of completed habit IDs for quick lookup
    const completedHabitIds = new Set(completionsData?.map((c: any) => c.habit_id) || []);

    return habitsData.map(habit => ({
      id: habit.id,
      name: habit.name,
      description: habit.description,
      completed: completedHabitIds.has(habit.id),
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
    console.log('Toggling habit for date:', habitId, dateStr, completed);

    if (completed) {
      // Add completion record using raw SQL to avoid TypeScript issues
      const { error } = await supabase
        .rpc('add_habit_completion', {
          p_habit_id: habitId,
          p_user_id: userId,
          p_completed_date: dateStr
        });

      if (error) {
        console.error('Error adding habit completion:', error);
        // Fall back to updating the habit directly if the function doesn't exist
        await this.updateHabit(habitId, userId, { completed: true });
      }
    } else {
      // Remove completion record using raw SQL to avoid TypeScript issues
      const { error } = await supabase
        .rpc('remove_habit_completion', {
          p_habit_id: habitId,
          p_user_id: userId,
          p_completed_date: dateStr
        });

      if (error) {
        console.error('Error removing habit completion:', error);
        // Fall back to updating the habit directly if the function doesn't exist
        await this.updateHabit(habitId, userId, { completed: false });
      }
    }
  }
}

export const supabaseHabitsService = new SupabaseHabitsService();
