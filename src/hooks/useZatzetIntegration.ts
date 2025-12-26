import { useState, useEffect, useCallback } from 'react';
import { IntegrationConnection, ZatzetInitiative, DEFAULT_ZATZET_ENDPOINT } from '@/types/integration';
import { IntegrationService } from '@/services/IntegrationService';
import { ZatzetSyncService } from '@/services/ZatzetSyncService';
import { toast } from '@/hooks/use-toast';

export const useZatzetIntegration = () => {
  const [connection, setConnection] = useState<IntegrationConnection | null>(null);
  const [initiatives, setInitiatives] = useState<ZatzetInitiative[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load existing connection on mount
  const loadConnection = useCallback(async () => {
    setIsLoading(true);
    try {
      const conn = await IntegrationService.getConnection();
      setConnection(conn);
    } catch (error) {
      console.error('Failed to load connection:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnection();
  }, [loadConnection]);

  // Test connection
  const testConnection = async (apiEndpoint: string, apiKey: string) => {
    setIsTesting(true);
    try {
      const result = await ZatzetSyncService.testConnection(apiEndpoint, apiKey);
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: "Successfully connected to Zatzet OKR API",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect to Zatzet OKR API",
          variant: "destructive",
        });
      }
      return result;
    } finally {
      setIsTesting(false);
    }
  };

  // Save connection
  const saveConnection = async (apiEndpoint: string, apiKey: string) => {
    setIsLoading(true);
    try {
      const result = await IntegrationService.saveConnection(apiEndpoint, apiKey);
      if (result.success) {
        await loadConnection();
        toast({
          title: "Connection Saved",
          description: "Integration configuration saved successfully",
        });
      } else {
        toast({
          title: "Save Failed",
          description: result.error || "Failed to save connection",
          variant: "destructive",
        });
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete connection
  const deleteConnection = async () => {
    setIsLoading(true);
    try {
      const result = await IntegrationService.deleteConnection();
      if (result.success) {
        setConnection(null);
        setInitiatives([]);
        toast({
          title: "Connection Removed",
          description: "Integration has been disconnected",
        });
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initiatives
  const fetchInitiatives = async () => {
    if (!connection?.api_key_encrypted) {
      toast({
        title: "Not Connected",
        description: "Please configure your Zatzet OKR connection first",
        variant: "destructive",
      });
      return { success: false };
    }

    setIsSyncing(true);
    try {
      const result = await ZatzetSyncService.fetchInitiatives(
        connection.api_endpoint,
        connection.api_key_encrypted
      );
      if (result.success && result.initiatives) {
        setInitiatives(result.initiatives);
        toast({
          title: "Initiatives Loaded",
          description: `Found ${result.initiatives.length} initiatives`,
        });
      } else {
        toast({
          title: "Fetch Failed",
          description: result.error || "Failed to fetch initiatives",
          variant: "destructive",
        });
      }
      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  // Import initiatives
  const importInitiatives = async (initiativeIds: string[]) => {
    if (!connection?.api_key_encrypted) {
      toast({
        title: "Not Connected",
        description: "Please configure your Zatzet OKR connection first",
        variant: "destructive",
      });
      return { success: false };
    }

    setIsSyncing(true);
    try {
      const result = await ZatzetSyncService.importInitiatives(
        connection.api_endpoint,
        connection.api_key_encrypted,
        initiativeIds
      );
      
      if (result.success && result.summary) {
        toast({
          title: "Import Complete",
          description: `Successfully imported ${result.summary.success} of ${result.summary.total} initiatives as goals`,
        });
        await loadConnection(); // Refresh to get updated last_sync_at
      } else {
        toast({
          title: "Import Failed",
          description: result.error || "Failed to import initiatives",
          variant: "destructive",
        });
      }
      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    connection,
    initiatives,
    isLoading,
    isTesting,
    isSyncing,
    isConnected: connection?.is_connected ?? false,
    testConnection,
    saveConnection,
    deleteConnection,
    fetchInitiatives,
    importInitiatives,
    refreshConnection: loadConnection,
  };
};
