// Zatzet OKR data types
export interface ZatzetInitiative {
  id: string;
  title: string;
  description?: string;
  target_date?: string;
  status?: 'active' | 'completed' | 'on_hold';
  progress?: number;
  key_result_id?: string;
  supporters?: ZatzetSupporter[];
}

export interface ZatzetSupporter {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

export interface ZatzetObjective {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  progress?: number;
  key_results?: ZatzetKeyResult[];
}

export interface ZatzetKeyResult {
  id: string;
  objective_id: string;
  title: string;
  target: number;
  current: number;
  initiatives?: ZatzetInitiative[];
}

// Integration configuration types
export interface IntegrationConnection {
  id: string;
  user_id: string;
  integration_type: 'zatzet_okr';
  api_endpoint: string;
  api_key_encrypted?: string;
  is_connected: boolean;
  last_sync_at?: string;
  sync_settings: SyncSettings;
  created_at: string;
  updated_at: string;
}

export interface SyncSettings {
  autoSync: boolean;
  direction: 'import' | 'export' | 'bidirectional';
  mappings: EndpointMapping[];
}

export interface EndpointMapping {
  zatzetEntity: 'initiatives' | 'objectives' | 'key_results';
  bettermeEntity: 'goal' | 'weekly_output' | 'task';
  enabled: boolean;
}

export interface IntegrationSyncLog {
  id: string;
  connection_id: string;
  sync_type: string;
  external_id: string;
  internal_id?: string;
  sync_status: 'pending' | 'success' | 'failed';
  sync_direction: 'import' | 'export';
  error_message?: string;
  synced_at: string;
  created_at: string;
}

// API response types
export interface ZatzetApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ImportResult {
  initiativeId: string;
  goalId?: string;
  success: boolean;
  error?: string;
}

export interface ImportSummary {
  total: number;
  success: number;
  results: ImportResult[];
}

// Default configuration
export const DEFAULT_ZATZET_ENDPOINT = 'https://ftetzacrjcfeevfczinb.supabase.co/functions/v1/public-api';

export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  autoSync: false,
  direction: 'import',
  mappings: [
    { zatzetEntity: 'initiatives', bettermeEntity: 'goal', enabled: true },
  ],
};
