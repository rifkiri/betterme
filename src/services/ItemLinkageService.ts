import { supabase } from '@/integrations/supabase/client';

export interface ItemLinkage {
  id: string;
  userId: string;
  sourceType: 'goal' | 'task' | 'weekly_output' | 'habit';
  sourceId: string;
  targetType: 'goal' | 'task' | 'weekly_output' | 'habit';
  targetId: string;
  createdAt: string;
}

export interface LinkedItem {
  type: 'goal' | 'task' | 'weekly_output' | 'habit';
  id: string;
  createdAt: string;
}

export class ItemLinkageService {
  /**
   * Validate if an item is active (not deleted/archived)
   */
  private async validateItemActive(
    itemType: ItemLinkage['sourceType'],
    itemId: string,
    userId: string
  ): Promise<boolean> {
    console.log(`🔍 Validating ${itemType} with ID: ${itemId} for user: ${userId}`);
    
    try {
      switch (itemType) {
        case 'goal': {
          // Goals are globally accessible via RLS, so don't filter by user_id
          const { data, error } = await supabase
            .from('goals')
            .select('is_deleted, archived')
            .eq('id', itemId)
            .maybeSingle();
          
          if (error) {
            console.error(`❌ Error validating goal ${itemId}:`, error);
            return false;
          }
          
          const isActive = data && !data.is_deleted && !data.archived;
          console.log(`✅ Goal ${itemId} validation result:`, { data, isActive });
          return isActive;
        }
        case 'weekly_output': {
          const { data, error } = await supabase
            .from('weekly_outputs')
            .select('is_deleted')
            .eq('id', itemId)
            .maybeSingle();
          
          if (error) {
            console.error(`❌ Error validating weekly_output ${itemId}:`, error);
            return false;
          }
          
          const isActive = data && !data.is_deleted;
          console.log(`✅ Weekly output ${itemId} validation result:`, { data, isActive });
          return isActive;
        }
        case 'task': {
          const { data, error } = await supabase
            .from('tasks')
            .select('is_deleted')
            .eq('id', itemId)
            .eq('user_id', userId)
            .maybeSingle();
          
          if (error) {
            console.error(`❌ Error validating task ${itemId}:`, error);
            return false;
          }
          
          const isActive = data && !data.is_deleted;
          console.log(`✅ Task ${itemId} validation result:`, { data, isActive });
          return isActive;
        }
        case 'habit': {
          const { data, error } = await supabase
            .from('habits')
            .select('is_deleted, archived')
            .eq('id', itemId)
            .eq('user_id', userId)
            .maybeSingle();
          
          if (error) {
            console.error(`❌ Error validating habit ${itemId}:`, error);
            return false;
          }
          
          const isActive = data && !data.is_deleted && !data.archived;
          console.log(`✅ Habit ${itemId} validation result:`, { data, isActive });
          return isActive;
        }
        default:
          console.error(`❌ Unknown item type: ${itemType}`);
          return false;
      }
    } catch (error) {
      console.error(`❌ Exception during validation of ${itemType} ${itemId}:`, error);
      return false;
    }
  }

  /**
   * Create a bidirectional link between two items (only if both are active)
   */
  async createLink(
    sourceType: ItemLinkage['sourceType'],
    sourceId: string,
    targetType: ItemLinkage['targetType'],
    targetId: string,
    userId: string
  ): Promise<void> {
    console.log(`🔗 Creating link: ${sourceType}(${sourceId}) -> ${targetType}(${targetId}) for user ${userId}`);
    
    try {
      // Validate both items are active before creating link
      console.log(`🔍 Validating items before creating link...`);
      const [sourceActive, targetActive] = await Promise.all([
        this.validateItemActive(sourceType, sourceId, userId),
        this.validateItemActive(targetType, targetId, userId)
      ]);

      console.log(`🔍 Validation results - Source active: ${sourceActive}, Target active: ${targetActive}`);

      if (!sourceActive) {
        const error = `Source ${sourceType}(${sourceId}) is not active or not found`;
        console.error(`❌ ${error}`);
        throw new Error(error);
      }
      if (!targetActive) {
        const error = `Target ${targetType}(${targetId}) is not active or not found`;
        console.error(`❌ ${error}`);
        throw new Error(error);
      }

      console.log(`💾 Inserting linkage into database...`);
      const { error } = await supabase
        .from('item_linkages')
        .insert({
          user_id: userId,
          source_type: sourceType,
          source_id: sourceId,
          target_type: targetType,
          target_id: targetId
        });

      if (error) {
        console.error(`❌ Database error creating link:`, error);
        throw new Error(`Failed to create link: ${error.message}`);
      }

      console.log(`✅ Successfully created link: ${sourceType}(${sourceId}) -> ${targetType}(${targetId})`);
    } catch (error) {
      console.error(`❌ Failed to create link:`, error);
      throw error;
    }
  }

  /**
   * Remove a bidirectional link between two items
   */
  async removeLink(
    sourceType: ItemLinkage['sourceType'],
    sourceId: string,
    targetType: ItemLinkage['targetType'],
    targetId: string,
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('item_linkages')
      .delete()
      .eq('user_id', userId)
      .or(`and(source_type.eq.${sourceType},source_id.eq.${sourceId},target_type.eq.${targetType},target_id.eq.${targetId}),and(source_type.eq.${targetType},source_id.eq.${targetId},target_type.eq.${sourceType},target_id.eq.${sourceId})`);

    if (error) {
      throw new Error(`Failed to remove link: ${error.message}`);
    }
  }

  /**
   * Get all items linked to a specific item
   */
  async getLinkedItems(
    itemType: ItemLinkage['sourceType'],
    itemId: string,
    userId: string
  ): Promise<LinkedItem[]> {
    const { data, error } = await supabase
      .rpc('get_item_linkages', {
        p_item_type: itemType,
        p_item_id: itemId,
        p_user_id: userId
      });

    if (error) {
      throw new Error(`Failed to get linked items: ${error.message}`);
    }

    return (data || []).map((item: any) => ({
      type: item.target_type,
      id: item.target_id,
      createdAt: item.created_at
    }));
  }

  /**
   * Get all linkages for a user
   */
  async getUserLinkages(userId: string): Promise<ItemLinkage[]> {
    const { data, error } = await supabase
      .from('item_linkages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get user linkages: ${error.message}`);
    }

    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      sourceType: item.source_type as ItemLinkage['sourceType'],
      sourceId: item.source_id,
      targetType: item.target_type as ItemLinkage['targetType'],
      targetId: item.target_id,
      createdAt: item.created_at
    }));
  }

  /**
   * Update multiple links for an item (replaces all existing links)
   */
  async updateLinks(
    itemType: ItemLinkage['sourceType'],
    itemId: string,
    targetType: ItemLinkage['targetType'],
    targetIds: string[],
    userId: string
  ): Promise<void> {
    // Remove all existing links of this type
    await supabase
      .from('item_linkages')
      .delete()
      .eq('user_id', userId)
      .or(`and(source_type.eq.${itemType},source_id.eq.${itemId},target_type.eq.${targetType}),and(source_type.eq.${targetType},target_type.eq.${itemType},target_id.eq.${itemId})`);

    // Add new links
    if (targetIds.length > 0) {
      const newLinks = targetIds.map(targetId => ({
        user_id: userId,
        source_type: itemType,
        source_id: itemId,
        target_type: targetType,
        target_id: targetId
      }));

      const { error } = await supabase
        .from('item_linkages')
        .insert(newLinks);

      if (error) {
        throw new Error(`Failed to update links: ${error.message}`);
      }
    }
  }

  /**
   * Remove stale linkages for a user (cleanup method)
   */
  async removeStaleLinksForUser(userId: string): Promise<void> {
    const { error } = await supabase.rpc('cleanup_stale_linkages');
    if (error) {
      throw new Error(`Failed to cleanup stale linkages: ${error.message}`);
    }
  }

  /**
   * Get linked goal IDs for a weekly output (for backward compatibility)
   */
  async getLinkedGoalIds(outputId: string, userId: string): Promise<string[]> {
    const linkedItems = await this.getLinkedItems('weekly_output', outputId, userId);
    return linkedItems
      .filter(item => item.type === 'goal')
      .map(item => item.id);
  }

  /**
   * Get linked output IDs for a goal (for backward compatibility)
   */
  async getLinkedOutputIds(goalId: string, userId: string): Promise<string[]> {
    const linkedItems = await this.getLinkedItems('goal', goalId, userId);
    return linkedItems
      .filter(item => item.type === 'weekly_output')
      .map(item => item.id);
  }
}

export const itemLinkageService = new ItemLinkageService();