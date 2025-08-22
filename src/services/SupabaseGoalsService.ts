import { supabase } from '@/integrations/supabase/client';
import type { Goal, GoalAssignment, GoalNotification } from '@/types/productivity';
import { toast } from 'sonner';
import {
  transformGoalRow,
  transformGoalToRow,
} from '@/utils/typeTransformers';

export class SupabaseGoalsService {
  // Basic goal CRUD operations
  static async getAllGoals(userId: string): Promise<Goal[]> {
    console.log('🔍 [SupabaseGoalsService] getAllGoals called for user:', userId);
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_date', { ascending: false });
      
      if (error) {
        console.error('❌ [SupabaseGoalsService] Error fetching goals:', error);
        throw error;
      }
      
      console.log('✅ [SupabaseGoalsService] Goals fetched successfully:', data?.length || 0);
      return data.map(transformGoalRow);
    } catch (error) {
      console.error('❌ [SupabaseGoalsService] getAllGoals failed:', error);
      throw error;
    }
  }

  static async getGoalsWithRoles(userId: string): Promise<Goal[]> {
    console.log('🔍 [SupabaseGoalsService] getGoalsWithRoles called for user:', userId);
    
    try {
      // Get all goals where user is owner, coach, lead, or member
      const { data: allGoals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .or(`user_id.eq.${userId},coach_id.eq.${userId}`)
        .eq('is_deleted', false)
        .order('created_date', { ascending: false });

      if (goalsError) {
        console.error('❌ [SupabaseGoalsService] Error fetching goals:', goalsError);
        throw goalsError;
      }

      if (!allGoals || allGoals.length === 0) {
        console.log('ℹ️ [SupabaseGoalsService] No goals found for user');
        return [];
      }

      console.log('📊 [SupabaseGoalsService] Found goals:', allGoals.length);

      // Use existing goal assignments from the database fields instead of separate table
      const goalsWithRoles = allGoals.map((goal) => {
        console.log('Goal role data:', {
          goalId: goal.id,
          title: goal.title,
          coachId: goal.coach_id,
          leadIds: goal.lead_ids || [],
          memberIds: goal.member_ids || [],
        });

        return {
          ...transformGoalRow(goal),
          coachId: goal.coach_id,
          leadIds: goal.lead_ids || [],
          memberIds: goal.member_ids || [],
        };
      });

      console.log('✅ [SupabaseGoalsService] Goals with roles processed successfully');
      return goalsWithRoles;
    } catch (error) {
      console.error('❌ [SupabaseGoalsService] getGoalsWithRoles failed:', error);
      throw error;
    }
  }

  static async createGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
    console.log('🔍 [SupabaseGoalsService] createGoal called:', goal.title);
    try {
      const goalData = transformGoalToRow(goal);
      
      const { data, error } = await supabase
        .from('goals')
        .insert(goalData)
        .select()
        .single();
      
      if (error) {
        console.error('❌ [SupabaseGoalsService] Error creating goal:', error);
        throw error;
      }
      
      console.log('✅ [SupabaseGoalsService] Goal created successfully:', data.id);
      return transformGoalRow(data);
    } catch (error) {
      console.error('❌ [SupabaseGoalsService] createGoal failed:', error);
      throw error;
    }
  }

  static async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    console.log('🔍 [SupabaseGoalsService] updateGoal called for goal:', id);
    try {
      const updateData = transformGoalToRow(updates);
      
      const { data, error } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ [SupabaseGoalsService] Error updating goal:', error);
        throw error;
      }
      
      console.log('✅ [SupabaseGoalsService] Goal updated successfully');
      return transformGoalRow(data);
    } catch (error) {
      console.error('❌ [SupabaseGoalsService] updateGoal failed:', error);
      throw error;
    }
  }

  static async deleteGoal(id: string, userId: string): Promise<void> {
    console.log('🔍 [SupabaseGoalsService] deleteGoal called for goal:', id);
    try {
      const { error } = await supabase
        .from('goals')
        .update({ 
          is_deleted: true,
          deleted_date: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) {
        console.error('❌ [SupabaseGoalsService] Error deleting goal:', error);
        throw error;
      }
      
      console.log('✅ [SupabaseGoalsService] Goal deleted successfully');
    } catch (error) {
      console.error('❌ [SupabaseGoalsService] deleteGoal failed:', error);
      throw error;
    }
  }

  static async moveGoal(goalId: string, newDeadline: Date, userId: string): Promise<Goal> {
    console.log('🔍 [SupabaseGoalsService] moveGoal called for goal:', goalId);
    try {
      const { data, error } = await supabase
        .from('goals')
        .update({
          deadline: newDeadline.toISOString().split('T')[0],
          is_moved: true
        })
        .eq('id', goalId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ [SupabaseGoalsService] Error moving goal:', error);
        throw error;
      }
      
      console.log('✅ [SupabaseGoalsService] Goal moved successfully');
      return transformGoalRow(data);
    } catch (error) {
      console.error('❌ [SupabaseGoalsService] moveGoal failed:', error);
      throw error;
    }
  }

  // Goal assignment methods (simplified without goal_assignments table)
  static async assignUserToGoal(goalId: string, userId: string, role: 'coach' | 'lead' | 'member', assignedBy: string): Promise<void> {
    console.log('🔍 [SupabaseGoalsService] assignUserToGoal called:', { goalId, userId, role });
    
    try {
      // Get current goal data
      const { data: goal, error: getError } = await supabase
        .from('goals')
        .select('coach_id, lead_ids, member_ids')
        .eq('id', goalId)
        .single();

      if (getError) throw getError;

      let updateData: any = {};

      switch (role) {
        case 'coach':
          updateData.coach_id = userId;
          break;
        case 'lead':
          const currentLeadIds = goal.lead_ids || [];
          if (!currentLeadIds.includes(userId)) {
            updateData.lead_ids = [...currentLeadIds, userId];
          }
          break;
        case 'member':
          const currentMemberIds = goal.member_ids || [];
          if (!currentMemberIds.includes(userId)) {
            updateData.member_ids = [...currentMemberIds, userId];
          }
          break;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('goals')
          .update(updateData)
          .eq('id', goalId);

        if (updateError) throw updateError;
      }

      console.log('✅ [SupabaseGoalsService] User assigned to goal successfully');
    } catch (error) {
      console.error('❌ [SupabaseGoalsService] assignUserToGoal failed:', error);
      throw error;
    }
  }

  static async removeUserFromGoal(goalId: string, userId: string): Promise<void> {
    console.log('🔍 [SupabaseGoalsService] removeUserFromGoal called:', { goalId, userId });
    
    try {
      // Get current goal data
      const { data: goal, error: getError } = await supabase
        .from('goals')
        .select('coach_id, lead_ids, member_ids')
        .eq('id', goalId)
        .single();

      if (getError) throw getError;

      let updateData: any = {};

      // Remove from coach
      if (goal.coach_id === userId) {
        updateData.coach_id = null;
      }

      // Remove from leads
      const currentLeadIds = goal.lead_ids || [];
      if (currentLeadIds.includes(userId)) {
        updateData.lead_ids = currentLeadIds.filter(id => id !== userId);
      }

      // Remove from members
      const currentMemberIds = goal.member_ids || [];
      if (currentMemberIds.includes(userId)) {
        updateData.member_ids = currentMemberIds.filter(id => id !== userId);
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('goals')
          .update(updateData)
          .eq('id', goalId);

        if (updateError) throw updateError;
      }

      console.log('✅ [SupabaseGoalsService] User removed from goal successfully');
    } catch (error) {
      console.error('❌ [SupabaseGoalsService] removeUserFromGoal failed:', error);
      throw error;
    }
  }

  // Simplified access control
  static async canUserAccessGoal(goalId: string, userId: string): Promise<boolean> {
    console.log('🔍 [SupabaseGoalsService] canUserAccessGoal called:', { goalId, userId });
    
    try {
      const { data: goal, error } = await supabase
        .from('goals')
        .select('user_id, coach_id, lead_ids, member_ids, category')
        .eq('id', goalId)
        .eq('is_deleted', false)
        .single();

      if (error || !goal) {
        console.log('❌ [SupabaseGoalsService] Goal not found or error:', error);
        return false;
      }

      // Personal goals: only accessible by owner
      if (goal.category === 'personal') {
        return goal.user_id === userId;
      }

      // Work goals: check if user has any role
      const hasAccess = goal.user_id === userId ||
                       goal.coach_id === userId ||
                       (goal.lead_ids || []).includes(userId) ||
                       (goal.member_ids || []).includes(userId);

      console.log('✅ [SupabaseGoalsService] Access check result:', hasAccess);
      return hasAccess;
    } catch (error) {
      console.error('❌ [SupabaseGoalsService] canUserAccessGoal failed:', error);
      return false;
    }
  }

  // Link goals to weekly outputs (simplified)
  static async linkGoalToOutput(goalId: string, outputId: string, userId: string): Promise<void> {
    console.log('🔍 [SupabaseGoalsService] linkGoalToOutput called:', { goalId, outputId });
    
    try {
      // Create linkage using item_linkages table
      await supabase.rpc('cleanup_stale_linkages');
      
      const { error } = await supabase
        .from('item_linkages')
        .insert({
          source_type: 'goal',
          source_id: goalId,
          target_type: 'weekly_output',
          target_id: outputId,
          user_id: userId
        });

      if (error) throw error;
      
      console.log('✅ [SupabaseGoalsService] Goal linked to output successfully');
    } catch (error) {
      console.error('❌ [SupabaseGoalsService] linkGoalToOutput failed:', error);
      throw error;
    }
  }

  static async unlinkGoalFromOutput(goalId: string, outputId: string, userId: string): Promise<void> {
    console.log('🔍 [SupabaseGoalsService] unlinkGoalFromOutput called:', { goalId, outputId });
    
    try {
      const { error } = await supabase
        .from('item_linkages')
        .delete()
        .eq('source_type', 'goal')
        .eq('source_id', goalId)
        .eq('target_type', 'weekly_output')
        .eq('target_id', outputId)
        .eq('user_id', userId);

      if (error) throw error;
      
      console.log('✅ [SupabaseGoalsService] Goal unlinked from output successfully');
    } catch (error) {
      console.error('❌ [SupabaseGoalsService] unlinkGoalFromOutput failed:', error);
      throw error;
    }
  }
}