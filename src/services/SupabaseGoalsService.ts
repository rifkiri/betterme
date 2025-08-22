import { supabase } from '@/integrations/supabase/client';
import { Goal } from '@/types/productivity';

export class SupabaseGoalsService {
  private async getUserRole(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching user role:', error);
      return null;
    }

    return data.role;
  }

  async getGoals(userId: string): Promise<Goal[]> {
    console.log('Getting user-specific goals for user:', userId);
    
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
      category: goal.category as 'work' | 'personal',
      subcategory: goal.subcategory,
      deadline: goal.deadline ? new Date(goal.deadline) : undefined,
      createdDate: new Date(goal.created_date),
      completed: goal.completed,
      archived: goal.archived,
      progress: goal.progress || 0,
      userId: goal.user_id,
      createdBy: goal.created_by,
      assignmentDate: goal.assignment_date ? new Date(goal.assignment_date) : undefined
    }));
  }

  async getUserAccessibleGoals(userId: string): Promise<Goal[]> {
    console.log('Getting all accessible goals for user:', userId);
    
    // Clean approach: Get goals where user is owner OR has assignments
    const { data: allGoals, error: goalsError } = await supabase
      .from('goals')
      .select(`
        *,
        goal_assignments(
          user_id,
          role
        )
      `)
      .eq('is_deleted', false)
      .or(`user_id.eq.${userId},goal_assignments.user_id.eq.${userId}`)
      .order('created_date', { ascending: false });

    if (goalsError) {
      console.error('Error fetching accessible goals:', goalsError);
      throw goalsError;
    }

    if (!allGoals) {
      return [];
    }

    // Filter and transform goals
    const accessibleGoals = allGoals.filter(goal => {
      // Include personal goals owned by user
      if (goal.category === 'personal' && goal.user_id === userId) {
        return true;
      }
      
      // Include work goals where user is owner
      if (goal.category === 'work' && goal.user_id === userId) {
        return true;
      }
      
      // Include work goals where user has assignments
      if (goal.category === 'work' && goal.goal_assignments && goal.goal_assignments.length > 0) {
        return goal.goal_assignments.some((assignment: any) => assignment.user_id === userId);
      }
      
      return false;
    });

    console.log('Accessible goals for user', userId, ':', accessibleGoals.length);

    // Transform to Goal format (no legacy arrays, only assignments matter)
    return accessibleGoals.map(goal => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      category: goal.category as 'work' | 'personal',
      subcategory: goal.subcategory,
      deadline: goal.deadline ? new Date(goal.deadline) : undefined,
      createdDate: new Date(goal.created_date),
      completed: goal.completed,
      archived: goal.archived,
      progress: goal.progress || 0,
      userId: goal.user_id,
      createdBy: goal.created_by,
      assignmentDate: goal.assignment_date ? new Date(goal.assignment_date) : undefined
    }));
  }

  async getAllGoals(): Promise<Goal[]> {
    console.log('Getting all goals for work goal joining');
    
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('is_deleted', false)
        .order('created_date', { ascending: false });

      if (error) {
        console.error('Error fetching all goals:', error);
        throw error;
      }

      console.log('Raw goals from database:', {
        count: data?.length || 0,
        data: data?.map(goal => ({
          id: goal.id,
          title: goal.title,
          category: goal.category,
          user_id: goal.user_id,
          progress: goal.progress,
          archived: goal.archived,
          is_deleted: goal.is_deleted
        })) || []
      });

      if (!data) {
        return [];
      }

      const transformedGoals = data.map(goal => ({
        id: goal.id,
        userId: goal.user_id,
        title: goal.title,
        description: goal.description,
        category: goal.category as 'work' | 'personal',
        subcategory: goal.subcategory,
        deadline: goal.deadline ? new Date(goal.deadline) : undefined,
        createdDate: new Date(goal.created_date),
        completed: goal.completed,
        archived: goal.archived,
        progress: goal.progress || 0,
        createdBy: goal.created_by,
        assignmentDate: goal.assignment_date ? new Date(goal.assignment_date) : undefined
      }));

      console.log('Transformed goals for frontend:', {
        count: transformedGoals.length,
        workGoals: transformedGoals.filter(g => g.category === 'work').map(g => ({
          id: g.id,
          title: g.title,
          userId: g.userId,
          progress: g.progress,
          archived: g.archived
        }))
      });

      return transformedGoals;
    } catch (error) {
      console.error('Error in getAllGoals:', error);
      throw error;
    }
  }

  async addGoal(goal: Goal & { userId: string }): Promise<void> {
    console.log('Adding goal for user:', goal.userId, goal);
    
    const { error } = await supabase
      .from('goals')
      .insert({
        user_id: goal.userId,
        title: goal.title,
        description: goal.description,
        category: goal.category,
        subcategory: goal.subcategory,
        deadline: goal.deadline ? goal.deadline.toISOString().split('T')[0] : null,
        completed: goal.completed,
        archived: goal.archived,
        is_deleted: false,
        progress: 0, // Always start with 0% progress
        // linked_output_ids removed - now handled by ItemLinkageService
        created_by: goal.createdBy,
        assignment_date: goal.assignmentDate ? goal.assignmentDate.toISOString() : null
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
    if (updates.category) supabaseUpdates.category = updates.category;
    if (updates.subcategory !== undefined) supabaseUpdates.subcategory = updates.subcategory;
    if (updates.deadline !== undefined) {
      supabaseUpdates.deadline = updates.deadline ? updates.deadline.toISOString().split('T')[0] : null;
    }
    if (updates.completed !== undefined) supabaseUpdates.completed = updates.completed;
    if (updates.archived !== undefined) supabaseUpdates.archived = updates.archived;
    if (updates.progress !== undefined) {
      supabaseUpdates.progress = updates.progress;
    }
    // linkedOutputIds now handled by ItemLinkageService
    if (updates.createdBy !== undefined) supabaseUpdates.created_by = updates.createdBy;
    if (updates.assignmentDate !== undefined) {
      supabaseUpdates.assignment_date = updates.assignmentDate ? updates.assignmentDate.toISOString() : null;
    }

    // Handle soft delete (archiving)
    if (updates.archived !== undefined && updates.archived) {
      supabaseUpdates.is_deleted = true;
      supabaseUpdates.deleted_date = new Date().toISOString();
    }

    // No permission checks for general updates - allow all users to edit goals they have access to
    // The RLS policies will handle the actual access control at the database level

    const { error } = await supabase
      .from('goals')
      .update(supabaseUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  }

  private async canUserUpdateGoal(goalId: string, userId: string): Promise<boolean> {
    // Only allow goal creators to edit goals
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('created_by, user_id')
      .eq('id', goalId)
      .single();

    if (goalError || !goal) {
      console.error('Error fetching goal for permission check:', goalError);
      return false;
    }

    // Check if user is the creator or owner of the goal
    const isCreator = goal.created_by === userId;
    const isOwner = goal.user_id === userId;
    
    return isCreator || isOwner;
  }

  private async canUserLinkToGoal(goalId: string, userId: string): Promise<boolean> {
    // Allow linking if user can view the goal (has access to it)
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('id, user_id, category')
      .eq('id', goalId)
      .single();

    if (goalError || !goal) {
      console.error('Error fetching goal for linking permission check:', goalError);
      return false;
    }

    // Personal goals: only owner can link
    if (goal.category === 'personal') {
      return goal.user_id === userId;
    }

    // Work goals: check if user has any assignment to this goal
    const { data: assignment, error: assignmentError } = await supabase
      .from('goal_assignments')
      .select('id')
      .eq('goal_id', goalId)
      .eq('user_id', userId)
      .maybeSingle();

    if (assignmentError) {
      console.error('Error checking goal assignment for linking:', assignmentError);
      return false;
    }

    // Allow linking if user is assigned to the goal or owns it
    return !!assignment || goal.user_id === userId;
  }

  async updateGoalProgress(id: string, userId: string, progress: number): Promise<void> {
    console.log('🔥 [DB] Updating goal progress:', id, 'for user:', userId, 'to progress:', progress);
    
    // No permission check for progress updates - allow all users to update progress
    // The RLS policies will handle the actual access control at the database level

    console.log('🔥 [DB] Updating database...');
    const updateData = {
      progress: Math.max(0, Math.min(100, progress)),
      completed: progress >= 100 // Auto-complete if progress reaches 100%
    };

    const { data, error } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('🔥 [DB] Error updating goal progress:', error);
      throw error;
    }

    console.log('🔥 [DB] Goal progress updated successfully:', data);
  }

  async permanentlyDeleteGoal(id: string, userId: string): Promise<void> {
    console.log('Permanently deleting goal:', id, 'for user:', userId);
    
    // Only allow goal creators to delete their goals - simplified permission model
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Only goal creators can delete

    if (error) {
      console.error('Error permanently deleting goal:', error);
      throw error;
    }
  }

  async linkOutputToGoal(outputId: string, goalId: string, userId: string): Promise<void> {
    console.log('🔥 [DB] Linking output to goal via database function:', { outputId, goalId, userId });
    
    const { data, error } = await supabase.rpc('link_output_to_goal', {
      p_output_id: outputId,
      p_goal_id: goalId,
      p_user_id: userId
    });

    if (error) {
      console.error('Error linking output to goal:', error);
      throw error;
    }

    console.log('🔥 [DB] Successfully linked output to goal');
  }

  async unlinkOutputFromGoal(outputId: string, goalId: string, userId: string): Promise<void> {
    console.log('🔥 [DB] Unlinking output from goal via database function:', { outputId, goalId, userId });
    
    const { data, error } = await supabase.rpc('unlink_output_from_goal', {
      p_output_id: outputId,
      p_goal_id: goalId,
      p_user_id: userId
    });

    if (error) {
      console.error('Error unlinking output from goal:', error);
      throw error;
    }

    console.log('🔥 [DB] Successfully unlinked output from goal');
  }
}

export const supabaseGoalsService = new SupabaseGoalsService();