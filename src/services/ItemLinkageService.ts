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
   * Create a bidirectional link between two items
   */
  async createLink(
    sourceType: ItemLinkage['sourceType'],
    sourceId: string,
    targetType: ItemLinkage['targetType'],
    targetId: string,
    userId: string
  ): Promise<void> {
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
      throw new Error(`Failed to create link: ${error.message}`);
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