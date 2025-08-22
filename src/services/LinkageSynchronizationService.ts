import { supabase } from '@/integrations/supabase/client';
import { itemLinkageService, ItemLinkage } from './ItemLinkageService';

/**
 * DEPRECATED: LinkageSynchronizationService
 * 
 * This service was designed to sync data between direct column linkages 
 * (linked_goal_ids, linked_output_ids) and the item_linkages table.
 * 
 * Since we've moved to a pure item_linkages approach without direct columns,
 * this service is no longer needed but kept for reference.
 */
export class LinkageSynchronizationService {
  /**
   * Clear all linkages for a weekly output
   */
  async clearOutputLinkages(outputId: string, userId: string): Promise<void> {
    console.log('🔗 Clearing linkages for output:', { outputId, userId });
    
    // Clear linkages where weekly_output is the source
    const { error } = await supabase
      .from('item_linkages')
      .delete()
      .eq('user_id', userId)
      .eq('source_type', 'weekly_output')
      .eq('source_id', outputId);

    if (error) {
      console.error('❌ Failed to clear output linkages:', error);
      throw new Error(`Failed to clear output linkages: ${error.message}`);
    }
    
    console.log('✅ Successfully cleared output linkages');
  }

  /**
   * Clear all linkages for a goal
   */
  async clearGoalLinkages(goalId: string, userId: string): Promise<void> {
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
   * Cleanup stale linkages
   */
  async fullSynchronization(userId: string): Promise<void> {
    // Just cleanup stale linkages since we don't use direct columns anymore
    await itemLinkageService.removeStaleLinksForUser(userId);
  }
}

export const linkageSynchronizationService = new LinkageSynchronizationService();