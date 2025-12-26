import { supabase } from '@/integrations/supabase/client';
import { 
  IntegrationConnection, 
  SyncSettings, 
  DEFAULT_SYNC_SETTINGS,
} from '@/types/integration';

class IntegrationServiceClass {
  /**
   * Get the current user's integration connection
   */
  async getConnection(): Promise<IntegrationConnection | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('integration_type', 'zatzet_okr')
      .maybeSingle();

    if (error) {
      console.error('Error fetching integration connection:', error);
      return null;
    }

    if (!data) return null;

    // Transform the data to match our type
    return {
      ...data,
      sync_settings: (data.sync_settings as unknown as SyncSettings) || DEFAULT_SYNC_SETTINGS,
    } as IntegrationConnection;
  }

  /**
   * Save or update integration connection
   */
  async saveConnection(
    apiEndpoint: string,
    apiKey: string,
    syncSettings?: SyncSettings
  ): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const connectionData = {
      user_id: user.id,
      integration_type: 'zatzet_okr',
      api_endpoint: apiEndpoint,
      api_key_encrypted: apiKey,
      is_connected: true,
      sync_settings: JSON.parse(JSON.stringify(syncSettings || DEFAULT_SYNC_SETTINGS)),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('integration_connections')
      .upsert(connectionData, { 
        onConflict: 'user_id,integration_type',
      });

    if (error) {
      console.error('Error saving integration connection:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Delete integration connection
   */
  async deleteConnection(): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('integration_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('integration_type', 'zatzet_okr');

    if (error) {
      console.error('Error deleting integration connection:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Update connection status
   */
  async updateConnectionStatus(isConnected: boolean): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('integration_connections')
      .update({ is_connected: isConnected, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('integration_type', 'zatzet_okr');
  }

  /**
   * Update last sync timestamp
   */
  async updateLastSyncTime(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('integration_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('integration_type', 'zatzet_okr');
  }

  /**
   * Get sync history
   */
  async getSyncHistory(limit = 50): Promise<any[]> {
    const connection = await this.getConnection();
    if (!connection) return [];

    const { data, error } = await supabase
      .from('integration_sync_logs')
      .select('*')
      .eq('connection_id', connection.id)
      .order('synced_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching sync history:', error);
      return [];
    }

    return data || [];
  }
}

export const IntegrationService = new IntegrationServiceClass();
