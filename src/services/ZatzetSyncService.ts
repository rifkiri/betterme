import { supabase } from '@/integrations/supabase/client';
import { ZatzetInitiative, ImportResult, ImportSummary } from '@/types/integration';

export interface ExportProgressResult {
  success: boolean;
  error?: string;
  synced?: boolean;
  previousProgress?: number;
  newProgress?: number;
}

export interface RefreshGoalResult {
  success: boolean;
  error?: string;
  latestProgress?: number;
}

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
   * Export goal progress to Zatzet OKR
   */
  async exportGoalProgress(
    apiEndpoint: string,
    apiKey: string,
    goalId: string,
    progress: number
  ): Promise<ExportProgressResult> {
    try {
      const { data, error } = await supabase.functions.invoke('zatzet-sync', {
        body: {
          action: 'export-progress',
          apiEndpoint,
          apiKey,
          goalId,
          progress,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        return { success: false, error: error.message };
      }

      return data;
    } catch (error: any) {
      console.error('Export progress error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Refresh goal from Zatzet OKR (fetch latest data)
   */
  async refreshGoalFromZatzet(
    apiEndpoint: string,
    apiKey: string,
    goalId: string
  ): Promise<RefreshGoalResult> {
    try {
      const { data, error } = await supabase.functions.invoke('zatzet-sync', {
        body: {
          action: 'refresh-goal',
          apiEndpoint,
          apiKey,
          goalId,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        return { success: false, error: error.message };
      }

      return data;
    } catch (error: any) {
      console.error('Refresh goal error:', error);
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

  /**
   * Check if a goal is linked to Zatzet OKR
   */
  async isGoalLinkedToZatzet(goalId: string): Promise<boolean> {
    const { data } = await supabase
      .from('integration_sync_logs')
      .select('id')
      .eq('internal_id', goalId)
      .eq('sync_type', 'initiative')
      .eq('sync_status', 'success')
      .maybeSingle();

    return !!data;
  }
}

export const ZatzetSyncService = new ZatzetSyncServiceClass();
