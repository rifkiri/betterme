import { supabase } from '@/integrations/supabase/client';
import { itemLinkageService, ItemLinkage } from './ItemLinkageService';

export class LinkageSynchronizationService {
  /**
   * Synchronize weekly output linkages from direct columns to item_linkages table
   */
  async syncWeeklyOutputLinkages(outputId: string, userId: string): Promise<void> {
    // Get the weekly output with its linked_goal_ids
    const { data: output, error } = await supabase
      .from('weekly_outputs')
      .select('linked_goal_ids')
      .eq('id', outputId)
      .eq('user_id', userId)
      .single();

    if (error || !output) {
      throw new Error(`Failed to fetch weekly output: ${error?.message}`);
    }

    const linkedGoalIds = output.linked_goal_ids || [];

    // Clear existing linkages for this output
    await this.clearOutputLinkages(outputId, userId);

    // Create new linkages in item_linkages table
    if (linkedGoalIds.length > 0) {
      const linkagePromises = linkedGoalIds.map(goalId =>
        itemLinkageService.createLink('weekly_output', outputId, 'goal', goalId, userId)
      );
      await Promise.all(linkagePromises);
    }

    // Update goals with linked_output_ids for consistency
    await this.updateGoalsWithOutputLinks(linkedGoalIds, outputId);
  }

  /**
   * Synchronize goal linkages from direct columns to item_linkages table
   */
  async syncGoalLinkages(goalId: string, userId: string): Promise<void> {
    // Get the goal with its linked_output_ids
    const { data: goal, error } = await supabase
      .from('goals')
      .select('linked_output_ids')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (error || !goal) {
      throw new Error(`Failed to fetch goal: ${error?.message}`);
    }

    const linkedOutputIds = goal.linked_output_ids || [];

    // Clear existing linkages for this goal
    await this.clearGoalLinkages(goalId, userId);

    // Create new linkages in item_linkages table
    if (linkedOutputIds.length > 0) {
      const linkagePromises = linkedOutputIds.map(outputId =>
        itemLinkageService.createLink('goal', goalId, 'weekly_output', outputId, userId)
      );
      await Promise.all(linkagePromises);
    }
  }

  /**
   * Full bidirectional sync for weekly output creation
   */
  async syncWeeklyOutputCreation(outputId: string, linkedGoalIds: string[], userId: string): Promise<void> {
    // Ensure the output exists with linked_goal_ids populated
    const { error: updateError } = await supabase
      .from('weekly_outputs')
      .update({ linked_goal_ids: linkedGoalIds })
      .eq('id', outputId)
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(`Failed to update weekly output linked_goal_ids: ${updateError.message}`);
    }

    // Sync to item_linkages table
    await this.syncWeeklyOutputLinkages(outputId, userId);
  }

  /**
   * Clear all linkages for a weekly output
   */
  private async clearOutputLinkages(outputId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('item_linkages')
      .delete()
      .eq('user_id', userId)
      .or(`and(source_type.eq.weekly_output,source_id.eq.${outputId}),and(target_type.eq.weekly_output,target_id.eq.${outputId})`);

    if (error) {
      throw new Error(`Failed to clear output linkages: ${error.message}`);
    }
  }

  /**
   * Clear all linkages for a goal
   */
  private async clearGoalLinkages(goalId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('item_linkages')
      .delete()
      .eq('user_id', userId)
      .or(`and(source_type.eq.goal,source_id.eq.${goalId}),and(target_type.eq.goal,target_id.eq.${goalId})`);

    if (error) {
      throw new Error(`Failed to clear goal linkages: ${error.message}`);
    }
  }

  /**
   * Update goals with linked_output_ids for consistency
   */
  private async updateGoalsWithOutputLinks(goalIds: string[], outputId: string): Promise<void> {
    const updatePromises = goalIds.map(async (goalId) => {
      // Get current linked_output_ids
      const { data: goal } = await supabase
        .from('goals')
        .select('linked_output_ids')
        .eq('id', goalId)
        .single();

      if (goal) {
        const currentOutputIds = goal.linked_output_ids || [];
        const updatedOutputIds = currentOutputIds.includes(outputId) 
          ? currentOutputIds 
          : [...currentOutputIds, outputId];

        await supabase
          .from('goals')
          .update({ linked_output_ids: updatedOutputIds })
          .eq('id', goalId);
      }
    });

    await Promise.all(updatePromises);
  }

  /**
   * Cleanup stale linkages and synchronize all data
   */
  async fullSynchronization(userId: string): Promise<void> {
    // First cleanup stale linkages
    await itemLinkageService.removeStaleLinksForUser(userId);

    // Get all user's weekly outputs and goals
    const [{ data: outputs }, { data: goals }] = await Promise.all([
      supabase
        .from('weekly_outputs')
        .select('id, linked_goal_ids')
        .eq('user_id', userId)
        .eq('is_deleted', false),
      supabase
        .from('goals')
        .select('id, linked_output_ids')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .eq('archived', false)
    ]);

    // Sync all weekly outputs
    if (outputs) {
      const outputSyncPromises = outputs.map(output => 
        this.syncWeeklyOutputLinkages(output.id, userId)
      );
      await Promise.all(outputSyncPromises);
    }

    // Sync all goals
    if (goals) {
      const goalSyncPromises = goals.map(goal => 
        this.syncGoalLinkages(goal.id, userId)
      );
      await Promise.all(goalSyncPromises);
    }
  }
}

export const linkageSynchronizationService = new LinkageSynchronizationService();