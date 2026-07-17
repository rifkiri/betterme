import { supabase } from '@/integrations/supabase/client';

export type ResourceEntityType = 'task' | 'weekly_output' | 'goal';

export interface ResourceLink {
  id: string;
  entityType: ResourceEntityType;
  entityId: string;
  label: string;
  url: string;
  addedBy: string | null;
  addedByName?: string;
  createdAt: string;
}

class ResourceLinksService {
  async getLinks(entityType: ResourceEntityType, entityId: string): Promise<ResourceLink[]> {
    const { data, error } = await supabase
      .from('resource_links' as any)
      .select('*, profiles:added_by(name)')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return ((data as any[]) || []).map(row => ({
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      label: row.label,
      url: row.url,
      addedBy: row.added_by,
      addedByName: row.profiles?.name ?? 'Unknown',
      createdAt: row.created_at,
    }));
  }

  async countLinks(entityType: ResourceEntityType, entityId: string): Promise<number> {
    const { count, error } = await supabase
      .from('resource_links' as any)
      .select('id', { count: 'exact', head: true })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);
    if (error) return 0;
    return count ?? 0;
  }

  async addLink(
    entityType: ResourceEntityType,
    entityId: string,
    label: string,
    url: string,
    addedBy: string
  ): Promise<ResourceLink> {
    const { data, error } = await supabase
      .from('resource_links' as any)
      .insert({ entity_type: entityType, entity_id: entityId, label, url, added_by: addedBy })
      .select('*, profiles:added_by(name)')
      .single();

    if (error) throw error;
    const row = data as any;
    return {
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      label: row.label,
      url: row.url,
      addedBy: row.added_by,
      addedByName: row.profiles?.name ?? 'Unknown',
      createdAt: row.created_at,
    };
  }

  async updateLink(id: string, label: string, url: string): Promise<void> {
    const { error } = await supabase
      .from('resource_links' as any)
      .update({ label, url })
      .eq('id', id);
    if (error) throw error;
  }

  async deleteLink(id: string): Promise<void> {
    const { error } = await supabase
      .from('resource_links' as any)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}

export const resourceLinksService = new ResourceLinksService();
