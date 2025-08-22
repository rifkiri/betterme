import { supabase } from '@/integrations/supabase/client';
import { Habit } from '@/types/productivity';
import { format } from 'date-fns';

export class SupabaseHabitsService {
  private mapAppCategoryToDatabase(appCategory?: string): 'health' | 'productivity' | 'personal' | 'fitness' | 'learning' | 'other' | 'mental' | 'relationship' | 'social' | 'spiritual' | 'wealth' | undefined {
    if (!appCategory || appCategory === 'No category') return undefined;
    
    const validCategories = ['health', 'productivity', 'personal', 'fitness', 'learning', 'other', 'mental', 'relationship', 'social', 'spiritual', 'wealth'] as const;
    const lowerCategory = appCategory.toLowerCase();
    
    if (validCategories.includes(lowerCategory as any)) {
      return lowerCategory as 'health' | 'productivity' | 'personal' | 'fitness' | 'learning' | 'other' | 'mental' | 'relationship' | 'social' | 'spiritual' | 'wealth';
    }
    
    return 'other';
  }

  async getHabits(userId: string): Promise<Habit[]> {
    console.log('Getting habits for user:', userId);
    
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching habits:', error);
      throw error;
    }

    console.log('Raw habits data for user', userId, ':', data);

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
      linkedGoalId: habit.linked_goal_id
    }));
  }

  async getHabitsForDate(userId: string, date: Date): Promise<Habit[]> {
    const dateStr = format(date, 'yyyy-MM-dd');
    console.log('🔄 Getting habits for user:', userId, 'and date:', dateStr);
    
    try {
      // Use the database function to get habits with completion status for the specific date
      console.log('🚀 Making RPC call to get_habits_for_date with params:', {
        user_id_param: userId,
        target_date: dateStr
      });
      
      const { data, error } = await supabase.rpc('get_habits_for_date', {
        user_id_param: userId,
        target_date: dateStr
      });

      if (error) {
        console.error('❌ Error fetching habits for date:', error);
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('✅ RPC call successful, received data:', data);
      console.log('Habits data for user', userId, 'date', dateStr, ':', data);

      const mappedData = data.map((habit: any) => ({
        id: habit.id,
        name: habit.name,
        description: habit.description,
        completed: habit.completed,
        streak: habit.streak,
        category: habit.category,
        archived: habit.archived,
        isDeleted: habit.is_deleted,
        createdAt: habit.created_at,
        linkedGoalId: habit.linked_goal_id,
        userId: userId // Ensure userId is set correctly
      }));

      console.log('Mapped habits data for user', userId, ':', mappedData);
      return mappedData;
    } catch (networkError) {
      console.error('❌ Network error calling get_habits_for_date:', networkError);
      throw networkError;
    }
  }

  async addHabit(habit: Habit & { userId: string }): Promise<void> {
    console.log('Adding habit for user:', habit.userId, habit);
    
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
        is_deleted: habit.isDeleted,
        linked_goal_id: habit.linkedGoalId || null
      });

    if (error) {
      console.error('Error adding habit:', error);
      throw error;
    }
  }

  async updateHabit(id: string, userId: string, updates: Partial<Habit>): Promise<void> {
    console.log('SupabaseHabitsService - Updating habit:', id, 'for user:', userId, 'with updates:', updates);
    
    const supabaseUpdates: any = {};
    
    if (updates.name) supabaseUpdates.name = updates.name;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;
    if (updates.completed !== undefined) supabaseUpdates.completed = updates.completed;
    if (updates.streak !== undefined) supabaseUpdates.streak = updates.streak;
    if (updates.category !== undefined) supabaseUpdates.category = this.mapAppCategoryToDatabase(updates.category);
    if (updates.archived !== undefined) supabaseUpdates.archived = updates.archived;
    if (updates.isDeleted !== undefined) supabaseUpdates.is_deleted = updates.isDeleted;
    if (updates.linkedGoalId !== undefined) {
      supabaseUpdates.linked_goal_id = (updates.linkedGoalId === "none" || !updates.linkedGoalId) ? null : updates.linkedGoalId;
      console.log('SupabaseHabitsService - linkedGoalId update:', updates.linkedGoalId, '→', supabaseUpdates.linked_goal_id);
      
      // If unlinking (setting to null), no need to manage linkages anymore
      if (updates.linkedGoalId === "none" || !updates.linkedGoalId) {
        console.log('🗑️ Unlinking habit from goal:', id);
      }
    }

    console.log('SupabaseHabitsService - Final supabase updates object:', supabaseUpdates);

    const { error } = await supabase
      .from('habits')
      .update(supabaseUpdates)
      .eq('id', id)
      .eq('user_id', userId); // Ensure we only update for the correct user

    if (error) {
      console.error('SupabaseHabitsService - Error updating habit:', error);
      throw error;
    }
    
    console.log('SupabaseHabitsService - Habit updated successfully');
  }

  async toggleHabitForDate(habitId: string, userId: string, date: Date, completed: boolean): Promise<void> {
    const dateStr = format(date, 'yyyy-MM-dd');
    console.log('Toggling habit completion - habit:', habitId, 'user:', userId, 'date:', dateStr, 'completed:', completed);

    // Use the database function to properly handle daily completions and streak calculation
    const { data, error } = await supabase.rpc('toggle_habit_completion', {
      habit_id_param: habitId,
      user_id_param: userId,
      target_date: dateStr,
      is_completed: completed
    });

    if (error) {
      console.error('Error toggling habit completion:', error);
      throw error;
    }

    console.log('Habit toggle result for user', userId, ':', data);
  }

  async permanentlyDeleteHabit(id: string, userId: string): Promise<void> {
    console.log('Permanently deleting habit:', id, 'for user:', userId);
    
    // First delete all habit completions for this habit
    const { error: completionsError } = await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', id)
      .eq('user_id', userId);

    if (completionsError) {
      console.error('Error deleting habit completions:', completionsError);
      throw completionsError;
    }

    // Then delete the habit itself
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error permanently deleting habit:', error);
      throw error;
    }
  }
}

export const supabaseHabitsService = new SupabaseHabitsService();
