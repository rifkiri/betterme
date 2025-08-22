import { supabase } from '@/integrations/supabase/client';

export interface LinkedItem {
  type: 'goal' | 'task' | 'weekly_output' | 'habit';
  id: string;
  created_at: string;
}

export class SimpleLinkageService {
  static async getLinkedItems(
    itemType: string,
    itemId: string,
    userId: string
  ): Promise<LinkedItem[]> {
    const { data, error } = await supabase.rpc('get_item_linkages', {
      p_item_type: itemType,
      p_item_id: itemId,
      p_user_id: userId
    });

    if (error) throw error;
    
    return (data || []).map((item: any) => ({
      type: item.target_type,
      id: item.target_id,
      created_at: item.created_at,
    }));
  }

  static async createLink(
    sourceType: string,
    sourceId: string,
    targetType: string,
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
        target_id: targetId,
      });

    if (error) throw error;
  }

  static async removeLink(
    sourceType: string,
    sourceId: string,
    targetType: string,
    targetId: string,
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('item_linkages')
      .delete()
      .match({
        user_id: userId,
        source_type: sourceType,
        source_id: sourceId,
        target_type: targetType,
        target_id: targetId,
      });

    if (error) throw error;

    // Also remove the reverse link
    await supabase
      .from('item_linkages')
      .delete()
      .match({
        user_id: userId,
        source_type: targetType,
        source_id: targetId,
        target_type: sourceType,
        target_id: sourceId,
      });
  }

  static async updateLinks(
    itemType: string,
    itemId: string,
    targetType: string,
    targetIds: string[],
    userId: string
  ): Promise<void> {
    // Remove existing links of this type
    await supabase
      .from('item_linkages')
      .delete()
      .match({
        user_id: userId,
        source_type: itemType,
        source_id: itemId,
        target_type: targetType,
      });

    await supabase
      .from('item_linkages')
      .delete()
      .match({
        user_id: userId,
        source_type: targetType,
        target_type: itemType,
        target_id: itemId,
      });

    // Create new links
    if (targetIds.length > 0) {
      const linkages = targetIds.flatMap(targetId => [
        {
          user_id: userId,
          source_type: itemType,
          source_id: itemId,
          target_type: targetType,
          target_id: targetId,
        },
        {
          user_id: userId,
          source_type: targetType,
          source_id: targetId,
          target_type: itemType,
          target_id: itemId,
        },
      ]);

      const { error } = await supabase
        .from('item_linkages')
        .insert(linkages);

      if (error) throw error;
    }
  }

  static async cleanupStaleLinks(): Promise<void> {
    const { error } = await supabase.rpc('cleanup_stale_linkages');
    if (error) throw error;
  }
}

export const linkageService = new SimpleLinkageService();