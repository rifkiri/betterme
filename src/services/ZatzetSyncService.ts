import { supabase } from '@/integrations/supabase/client';
import { ZatzetInitiative, ImportResult, ImportSummary } from '@/types/integration';

class ZatzetSyncServiceClass {
  /**
   * Test connection to Zatzet OKR API
   */
  async testConnection(
    apiEndpoint: string,
    apiKey: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('zatzet-sync', {
        body: {
          action: 'test-connection',
          apiEndpoint,
          apiKey,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        return { success: false, error: error.message };
      }

      return data;
    } catch (error: any) {
      console.error('Test connection error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch initiatives from Zatzet OKR
   */
  async fetchInitiatives(
    apiEndpoint: string,
    apiKey: string
  ): Promise<{ success: boolean; initiatives?: ZatzetInitiative[]; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('zatzet-sync', {
        body: {
          action: 'fetch-initiatives',
          apiEndpoint,
          apiKey,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        return { success: false, error: error.message };
      }

      return data;
    } catch (error: any) {
      console.error('Fetch initiatives error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Import selected initiatives as goals
   */
  async importInitiatives(
    apiEndpoint: string,
    apiKey: string,
    initiativeIds: string[]
  ): Promise<{ success: boolean; summary?: ImportSummary; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('zatzet-sync', {
        body: {
          action: 'import-initiatives',
          apiEndpoint,
          apiKey,
          initiativeIds,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        return { success: false, error: error.message };
      }

      if (data.success) {
        return {
          success: true,
          summary: {
            total: data.summary?.total || initiativeIds.length,
            success: data.summary?.success || 0,
            results: data.results || [],
          },
        };
      }

      return { success: false, error: data.error };
    } catch (error: any) {
      console.error('Import initiatives error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if an initiative has already been imported
   */
  async isInitiativeImported(externalId: string): Promise<boolean> {
    const { data } = await supabase
      .from('integration_sync_logs')
      .select('id')
      .eq('external_id', externalId)
      .eq('sync_type', 'initiative')
      .eq('sync_status', 'success')
      .maybeSingle();

    return !!data;
  }

  /**
   * Get the goal ID for an imported initiative
   */
  async getImportedGoalId(externalId: string): Promise<string | null> {
    const { data } = await supabase
      .from('integration_sync_logs')
      .select('internal_id')
      .eq('external_id', externalId)
      .eq('sync_type', 'initiative')
      .eq('sync_status', 'success')
      .maybeSingle();

    return data?.internal_id || null;
  }
}

export const ZatzetSyncService = new ZatzetSyncServiceClass();
