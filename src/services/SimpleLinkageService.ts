
import { supabase } from '@/integrations/supabase/client';

export class SimpleLinkageService {
  static async createLinkage(
    sourceId: string,
    sourceType: string,
    targetId: string,
    targetType: string,
    userId: string
  ) {
    const { data, error } = await supabase
      .from('item_linkages')
      .insert({
        source_id: sourceId,
        source_type: sourceType,
        target_id: targetId,
        target_type: targetType,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getLinkages(userId: string) {
    const { data, error } = await supabase
      .from('item_linkages')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }

  static async deleteLinkage(id: string) {
    const { error } = await supabase
      .from('item_linkages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
