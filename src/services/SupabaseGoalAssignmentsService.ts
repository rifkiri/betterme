import { supabase } from '@/integrations/supabase/client';
import { GoalAssignment } from '@/types/productivity';

export class SupabaseGoalAssignmentsService {
  async getGoalAssignments(userId: string): Promise<GoalAssignment[]> {
    console.log('Getting goal assignments for user:', userId);
    
    const { data, error } = await supabase
      .from('goal_assignments')
      .select('*')
      .eq('user_id', userId)
      .order('assigned_date', { ascending: false });

    if (error) {
      console.error('Error fetching goal assignments:', error);
      throw error;
    }

    return data.map(assignment => ({
      id: assignment.id,
      goalId: assignment.goal_id,
      userId: assignment.user_id,
      role: assignment.role as 'coach' | 'lead' | 'member',
      assignedBy: assignment.assigned_by,
      assignedDate: new Date(assignment.assigned_date),
      acknowledged: assignment.acknowledged,
      selfAssigned: assignment.self_assigned
    }));
  }

  async createGoalAssignment(assignment: Omit<GoalAssignment, 'id' | 'assignedDate'>): Promise<void> {
    console.log('Creating goal assignment:', assignment);
    
    // Verify authentication context before attempting insert
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Current authenticated user:', user?.id, 'Auth error:', authError);
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    if (user.id !== assignment.userId && user.id !== assignment.assignedBy) {
      console.warn('Authentication mismatch - User:', user.id, 'Assignment user:', assignment.userId, 'Assigned by:', assignment.assignedBy);
    }
    
    const insertData = {
      goal_id: assignment.goalId,
      user_id: assignment.userId,
      role: assignment.role,
      assigned_by: assignment.assignedBy,
      acknowledged: assignment.acknowledged,
      self_assigned: assignment.selfAssigned
    };
    
    console.log('Inserting goal assignment data:', insertData);
    
    const { data, error } = await supabase
      .from('goal_assignments')
      .insert(insertData)
      .select('*');

    console.log('Insert result - Data:', data, 'Error:', error);

    if (error) {
      console.error('Error creating goal assignment:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log('Successfully created goal assignment:', data);
  }

  async updateGoalAssignment(id: string, updates: Partial<GoalAssignment>): Promise<void> {
    console.log('Updating goal assignment:', id, updates);
    
    const supabaseUpdates: any = {};
    
    if (updates.acknowledged !== undefined) supabaseUpdates.acknowledged = updates.acknowledged;
    
    const { error } = await supabase
      .from('goal_assignments')
      .update(supabaseUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating goal assignment:', error);
      throw error;
    }
  }

  async deleteGoalAssignment(id: string): Promise<void> {
    console.log('Deleting goal assignment:', id);
    
    const { error } = await supabase
      .from('goal_assignments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting goal assignment:', error);
      throw error;
    }
  }

  async getAssignmentsForGoal(goalId: string): Promise<GoalAssignment[]> {
    console.log('Getting assignments for goal:', goalId);
    
    const { data, error } = await supabase
      .from('goal_assignments')
      .select('*')
      .eq('goal_id', goalId);

    if (error) {
      console.error('Error fetching goal assignments:', error);
      throw error;
    }

    return data.map(assignment => ({
      id: assignment.id,
      goalId: assignment.goal_id,
      userId: assignment.user_id,
      role: assignment.role as 'coach' | 'lead' | 'member',
      assignedBy: assignment.assigned_by,
      assignedDate: new Date(assignment.assigned_date),
      acknowledged: assignment.acknowledged,
      selfAssigned: assignment.self_assigned
    }));
  }
}

export const supabaseGoalAssignmentsService = new SupabaseGoalAssignmentsService();