import { supabase } from '@/integrations/supabase/client';
import { Goal } from '@/types/productivity';

export class SupabaseGoalsService {
  async getGoals(userId: string): Promise<Goal[]> {
    console.log('Getting goals for user:', userId);
    
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_date', { ascending: false });

    if (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }

    console.log('Raw goals data for user', userId, ':', data);

    return data.map(goal => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      targetValue: goal.target_value,
      currentValue: goal.current_value,
      unit: goal.unit,
      category: goal.category as 'daily' | 'weekly' | 'monthly' | 'custom',
      deadline: goal.deadline ? new Date(goal.deadline) : undefined,
      createdDate: new Date(goal.created_date),
      completed: goal.completed,
      archived: goal.archived,
      progress: goal.target_value > 0 ? Math.round((goal.current_value / goal.target_value) * 100) : 0,
      linkedOutputIds: goal.linked_output_ids || [],
      userId: goal.user_id
    }));
  }

  async addGoal(goal: Goal & { userId: string }): Promise<void> {
    console.log('Adding goal for user:', goal.userId, goal);
    
    const { error } = await supabase
      .from('goals')
      .insert({
        user_id: goal.userId,
        title: goal.title,
        description: goal.description,
        target_value: goal.targetValue,
        current_value: goal.currentValue,
        unit: goal.unit,
        category: goal.category,
        deadline: goal.deadline ? goal.deadline.toISOString().split('T')[0] : null,
        completed: goal.completed,
        archived: goal.archived,
        is_deleted: false,
        linked_output_ids: goal.linkedOutputIds || []
      });

    if (error) {
      console.error('Error adding goal:', error);
      throw error;
    }
  }

  async updateGoal(id: string, userId: string, updates: Partial<Goal>): Promise<void> {
    console.log('Updating goal:', id, 'for user:', userId, 'with updates:', updates);
    
    const supabaseUpdates: any = {};
    
    if (updates.title) supabaseUpdates.title = updates.title;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;
    if (updates.targetValue !== undefined) supabaseUpdates.target_value = updates.targetValue;
    if (updates.currentValue !== undefined) supabaseUpdates.current_value = updates.currentValue;
    if (updates.unit) supabaseUpdates.unit = updates.unit;
    if (updates.category) supabaseUpdates.category = updates.category;
    if (updates.deadline !== undefined) {
      supabaseUpdates.deadline = updates.deadline ? updates.deadline.toISOString().split('T')[0] : null;
    }
    if (updates.completed !== undefined) supabaseUpdates.completed = updates.completed;
    if (updates.archived !== undefined) supabaseUpdates.archived = updates.archived;
    if (updates.linkedOutputIds !== undefined) supabaseUpdates.linked_output_ids = updates.linkedOutputIds;

    // Handle soft delete
    if (updates.archived !== undefined && updates.archived) {
      supabaseUpdates.is_deleted = true;
      supabaseUpdates.deleted_date = new Date().toISOString();
    }

    const { error } = await supabase
      .from('goals')
      .update(supabaseUpdates)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  }

  async updateGoalProgress(id: string, userId: string, currentValue: number): Promise<void> {
    console.log('Updating goal progress:', id, 'for user:', userId, 'to value:', currentValue);
    
    const { error } = await supabase
      .from('goals')
      .update({
        current_value: currentValue,
        completed: currentValue >= 100 // Auto-complete if progress reaches 100%
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating goal progress:', error);
      throw error;
    }
  }

  async permanentlyDeleteGoal(id: string, userId: string): Promise<void> {
    console.log('Permanently deleting goal:', id, 'for user:', userId);
    
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error permanently deleting goal:', error);
      throw error;
    }
  }
}

export const supabaseGoalsService = new SupabaseGoalsService();