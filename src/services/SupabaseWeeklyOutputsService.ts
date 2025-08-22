
import { supabase } from '@/integrations/supabase/client';
import { WeeklyOutput } from '@/types/productivity';

export class SupabaseWeeklyOutputsService {
  async getWeeklyOutputs(userId: string): Promise<WeeklyOutput[]> {
    const { data, error } = await supabase
      .from('weekly_outputs')
      .select('*')
      .eq('user_id', userId)
      .order('created_date', { ascending: false });

    if (error) {
      console.error('Error fetching weekly outputs:', error);
      throw error;
    }

    return data.map(output => ({
      id: output.id,
      title: output.title,
      description: output.description,
      progress: output.progress,
      dueDate: new Date(output.due_date),
      originalDueDate: output.original_due_date ? new Date(output.original_due_date) : undefined,
      isMoved: output.is_moved,
      isDeleted: output.is_deleted,
      completedDate: output.completed_date ? new Date(output.completed_date) : undefined,
      deletedDate: output.deleted_date ? new Date(output.deleted_date) : undefined,
      createdDate: new Date(output.created_date),
      linkedGoalId: output.linked_goal_id || undefined // Restored from database column
    }));
  }

  async addWeeklyOutput(output: WeeklyOutput & { userId: string }): Promise<void> {
    const { error } = await supabase
      .from('weekly_outputs')
      .insert({
        user_id: output.userId,
        title: output.title,
        description: output.description,
        progress: output.progress,
        due_date: output.dueDate ? output.dueDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        original_due_date: output.originalDueDate?.toISOString().split('T')[0],
        is_moved: output.isMoved || false,
        is_deleted: output.isDeleted || false,
        completed_date: output.completedDate?.toISOString(),
        deleted_date: output.deletedDate?.toISOString(),
        created_date: output.createdDate.toISOString(),
        linked_goal_id: output.linkedGoalId || null
      });

    if (error) {
      console.error('Error adding weekly output:', error);
      throw error;
    }
  }

  async updateWeeklyOutput(id: string, userId: string, updates: Partial<WeeklyOutput>): Promise<void> {
    console.log('SupabaseWeeklyOutputsService - Updating output:', id, 'for user:', userId, 'with updates:', updates);
    
    const supabaseUpdates: any = {};
    
    if (updates.title) supabaseUpdates.title = updates.title;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;
    if (updates.progress !== undefined) supabaseUpdates.progress = updates.progress;
    if (updates.dueDate) supabaseUpdates.due_date = updates.dueDate.toISOString().split('T')[0];
    if (updates.originalDueDate) supabaseUpdates.original_due_date = updates.originalDueDate.toISOString().split('T')[0];
    if (updates.isMoved !== undefined) supabaseUpdates.is_moved = updates.isMoved;
    if (updates.isDeleted !== undefined) supabaseUpdates.is_deleted = updates.isDeleted;
    if (updates.completedDate) supabaseUpdates.completed_date = updates.completedDate.toISOString();
    if (updates.deletedDate) supabaseUpdates.deleted_date = updates.deletedDate.toISOString();
    if (updates.linkedGoalId !== undefined) {
      supabaseUpdates.linked_goal_id = (updates.linkedGoalId === "none" || !updates.linkedGoalId) ? null : updates.linkedGoalId;
      console.log('SupabaseWeeklyOutputsService - linkedGoalId update:', updates.linkedGoalId, '→', supabaseUpdates.linked_goal_id);
    }

    console.log('SupabaseWeeklyOutputsService - Final supabase updates object:', supabaseUpdates);

    const { error } = await supabase
      .from('weekly_outputs')
      .update(supabaseUpdates)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('SupabaseWeeklyOutputsService - Error updating weekly output:', error);
      throw error;
    }
    
    console.log('SupabaseWeeklyOutputsService - Weekly output updated successfully');
  }

  async permanentlyDeleteWeeklyOutput(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('weekly_outputs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error permanently deleting weekly output:', error);
      throw error;
    }
  }

  // Simplified linking - now handled directly through linkedGoalId column
  // These methods are kept for backward compatibility but use the simpler approach
  async linkToGoal(outputId: string, goalId: string, userId: string): Promise<void> {
    console.log('🔗 [Service] Linking output', outputId, 'to goal:', goalId);
    
    const { error } = await supabase
      .from('weekly_outputs')
      .update({ linked_goal_id: goalId })
      .eq('id', outputId)
      .eq('user_id', userId);

    if (error) {
      console.error('🔗 [Service] Error linking to goal:', error);
      throw error;
    }
    
    console.log('🔗 [Service] Successfully linked to goal', goalId);
  }

  async unlinkFromGoal(outputId: string, userId: string): Promise<void> {
    console.log('🔗 [Service] Unlinking output', outputId, 'from goal');
    
    const { error } = await supabase
      .from('weekly_outputs')
      .update({ linked_goal_id: null })
      .eq('id', outputId)
      .eq('user_id', userId);

    if (error) {
      console.error('🔗 [Service] Error unlinking from goal:', error);
      throw error;
    }
    
    console.log('🔗 [Service] Successfully unlinked from goal');
  }
}

export const supabaseWeeklyOutputsService = new SupabaseWeeklyOutputsService();
