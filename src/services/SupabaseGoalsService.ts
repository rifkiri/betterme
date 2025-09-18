import { supabase } from '@/integrations/supabase/client';
import { Goal } from '@/types/productivity';
import { formatDateForDatabase } from '@/lib/utils';

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

    // Debug: Check subcategory data specifically
    data.forEach(goal => {
      console.log(`Goal "${goal.title}" subcategory:`, goal.subcategory, '(type:', typeof goal.subcategory, ')');
    });

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
    
    try {
      // Get goals owned by user
      const { data: ownedGoals, error: ownedError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_date', { ascending: false });

      if (ownedError) {
        console.error('Error fetching owned goals:', ownedError);
        throw ownedError;
      }

      // Get goals where user has assignments
      const { data: assignedGoals, error: assignedError } = await supabase
        .from('goals')
        .select(`
          *,
          goal_assignments!inner(user_id, role)
        `)
        .eq('goal_assignments.user_id', userId)
        .eq('is_deleted', false)
        .order('created_date', { ascending: false });

      if (assignedError) {
        console.error('Error fetching assigned goals:', assignedError);
        // Don't throw, just use owned goals
      }

      // Combine and deduplicate goals
      const allGoalsMap = new Map();
      
      // Add owned goals
      (ownedGoals || []).forEach(goal => {
        allGoalsMap.set(goal.id, goal);
      });
      
      // Add assigned goals (if query succeeded)
      if (!assignedError && assignedGoals) {
        assignedGoals.forEach(goal => {
          allGoalsMap.set(goal.id, goal);
        });
      }

      const uniqueGoals = Array.from(allGoalsMap.values());
      console.log('Accessible goals for user', userId, ':', uniqueGoals.length);

      // Debug: Check subcategory data in accessible goals
      uniqueGoals.forEach(goal => {
        console.log(`[getUserAccessibleGoals] Goal "${goal.title}" subcategory:`, goal.subcategory, '(type:', typeof goal.subcategory, ')');
      });

      // Transform to Goal format
      const transformedGoals = uniqueGoals.map(goal => ({
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
        assignmentDate: goal.assignment_date ? new Date(goal.assignment_date) : undefined,
        visibility: goal.visibility || 'all'
      }));

      // Debug: Check subcategory data after transformation
      transformedGoals.forEach(goal => {
        console.log(`[getUserAccessibleGoals] Transformed goal "${goal.title}" subcategory:`, goal.subcategory, '(type:', typeof goal.subcategory, ')');
      });

      return transformedGoals;

    } catch (error) {
      console.error('Error in getUserAccessibleGoals:', error);
      // Fallback: just return user's own goals
      return this.getGoals(userId);
    }
  }

  async getAllGoals(): Promise<Goal[]> {
    console.log('Getting all goals for work goal joining');
    
    try {
      // Get current user to check their role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return [];
      }

      const userRole = await this.getUserRole(user.id);
      console.log('Current user role:', userRole);
      
      // The RLS policy will handle the filtering based on visibility
      // We just need to fetch all non-deleted goals and let RLS do its job
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('is_deleted', false)
        .order('created_date', { ascending: false });

      if (error) {
        console.error('Error fetching all goals:', error);
        // Return empty array instead of throwing to prevent UI crashes
        return [];
      }

      console.log('Raw goals from database:', {
        count: data?.length || 0,
        userRole: userRole,
        data: data?.map(goal => ({
          id: goal.id,
          title: goal.title,
          category: goal.category,
          visibility: goal.visibility,
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
        assignmentDate: goal.assignment_date ? new Date(goal.assignment_date) : undefined,
        visibility: (goal.visibility || 'all') as 'all' | 'managers' | 'self'
      }));

      console.log('Transformed goals for frontend:', {
        count: transformedGoals.length,
        workGoals: transformedGoals.filter(g => g.category === 'work').map(g => ({
          id: g.id,
          title: g.title,
          userId: g.userId,
          progress: g.progress,
          archived: g.archived,
          visibility: g.visibility
        }))
      });

      return transformedGoals;
    } catch (error) {
      console.error('Error in getAllGoals:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  async addGoal(goal: Goal & { userId: string }): Promise<void> {
    console.log('Adding goal for user:', goal.userId, goal);
    
    // Check user role to enforce visibility rules
    const userRole = await this.getUserRole(goal.userId);
    const enforceVisibility = (userRole === 'team-member') ? 'all' : (goal.visibility || 'all');
    
    const { error } = await supabase
      .from('goals')
      .insert({
        user_id: goal.userId,
        title: goal.title,
        description: goal.description,
        category: goal.category,
        subcategory: goal.subcategory,
        deadline: goal.deadline ? formatDateForDatabase(goal.deadline) : null,
        completed: goal.completed,
        archived: goal.archived,
        is_deleted: false,
        progress: 0, // Always start with 0% progress
        // linked_output_ids removed - now handled by ItemLinkageService
        created_by: goal.createdBy,
        assignment_date: goal.assignmentDate ? goal.assignmentDate.toISOString() : null,
        visibility: enforceVisibility
      });

    if (error) {
      console.error('Error adding goal:', error);
      throw error;
    }
  }

  async updateGoal(id: string, userId: string, updates: Partial<Goal>): Promise<void> {
    console.log('Updating goal:', id, 'for user:', userId, 'with updates:', updates);
    
    // Check user role to enforce visibility rules
    const userRole = await this.getUserRole(userId);
    const enforceVisibility = (userRole === 'team-member') 
      ? 'all' 
      : (updates.visibility !== undefined ? updates.visibility : undefined);
    
    const supabaseUpdates: any = {};
    
    if (updates.title) supabaseUpdates.title = updates.title;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;
    if (updates.category) supabaseUpdates.category = updates.category;
    if (updates.subcategory !== undefined) supabaseUpdates.subcategory = updates.subcategory;
    if (updates.deadline !== undefined) {
      supabaseUpdates.deadline = updates.deadline ? formatDateForDatabase(updates.deadline) : null;
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
    if (enforceVisibility !== undefined) supabaseUpdates.visibility = enforceVisibility;

    // Handle soft delete (archiving) - only set archived, not is_deleted
    // is_deleted should only be set for permanent deletion
    // if (updates.archived !== undefined && updates.archived) {
    //   supabaseUpdates.is_deleted = true;
    //   supabaseUpdates.deleted_date = new Date().toISOString();
    // }

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
    
    // Step 1: Unlink weekly outputs that reference this goal
    const { error: weeklyOutputsError } = await supabase
      .from('weekly_outputs')
      .update({ linked_goal_id: null })
      .eq('linked_goal_id', id);
    
    if (weeklyOutputsError) {
      console.error('Error unlinking weekly outputs:', weeklyOutputsError);
    }
    
    // Step 2: Unlink habits that reference this goal
    const { error: habitsError } = await supabase
      .from('habits')
      .update({ linked_goal_id: null })
      .eq('linked_goal_id', id);
    
    if (habitsError) {
      console.error('Error unlinking habits:', habitsError);
    }
    
    // Step 3: Delete goal assignments (these are specific to the goal)
    const { error: assignmentsError } = await supabase
      .from('goal_assignments')
      .delete()
      .eq('goal_id', id);
    
    if (assignmentsError) {
      console.error('Error deleting goal assignments:', assignmentsError);
    }
    
    // Step 4: Delete goal notifications (these are specific to the goal)
    const { error: notificationsError } = await supabase
      .from('goal_notifications')
      .delete()
      .eq('goal_id', id);
    
    if (notificationsError) {
      console.error('Error deleting goal notifications:', notificationsError);
    }
    
    // Step 5: Soft delete the goal by setting both archived and is_deleted flags
    const { error } = await supabase
      .from('goals')
      .update({ 
        archived: true,
        is_deleted: true,
        deleted_date: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error permanently deleting goal:', error);
      throw error;
    }
  }

  // Remove deprecated database function methods
  // These were removed when dropping the item_linkages table
}

export const supabaseGoalsService = new SupabaseGoalsService();