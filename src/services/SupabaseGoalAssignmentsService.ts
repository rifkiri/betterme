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
    
    // Use the security definer function to bypass auth context issues
    const { error } = await supabase.rpc('create_goal_assignment', {
      p_goal_id: assignment.goalId,
      p_user_id: assignment.userId,
      p_role: assignment.role,
      p_assigned_by: assignment.assignedBy,
      p_self_assigned: assignment.selfAssigned
    });

    if (error) {
      console.error('Error creating goal assignment:', error);
      throw error;
    }
    
    console.log('Successfully created goal assignment');
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

  async getAllGoalAssignments(): Promise<GoalAssignment[]> {
    console.log('Getting all goal assignments');
    
    const { data, error } = await supabase
      .from('goal_assignments')
      .select('*')
      .order('assigned_date', { ascending: false });

    if (error) {
      console.error('Error fetching all goal assignments:', error);
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