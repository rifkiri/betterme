import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Link2, Settings, RefreshCw, Trash2 } from 'lucide-react';
import { useZatzetIntegration } from '@/hooks/useZatzetIntegration';
import { ZatzetConnectionDialog } from '@/components/integration/ZatzetConnectionDialog';
import { ZatzetSyncPreviewDialog } from '@/components/integration/ZatzetSyncPreviewDialog';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const IntegrationsSection: React.FC = () => {
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  
  const {
    connection,
    isLoading,
    isSyncing,
    isConnected,
    deleteConnection,
    fetchInitiatives,
    initiatives,
    importInitiatives,
  } = useZatzetIntegration();

  const handleSyncNow = async () => {
    const result = await fetchInitiatives();
    if (result.success) {
      setSyncDialogOpen(true);
    }
  };

  const handleImport = async (selectedIds: string[]) => {
    await importInitiatives(selectedIds);
    setSyncDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="text-lg font-semibold text-foreground">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Connect external services to sync data with BetterMe
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Zatzet OKR</CardTitle>
                <CardDescription>
                  Import Initiatives from Zatzet OKR as Goals in Marketplace
                </CardDescription>
              </div>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Connected' : 'Not Connected'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isConnected && connection ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>
                  <span className="font-medium">Endpoint:</span>{' '}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    {connection.api_endpoint}
                  </code>
                </p>
                {connection.last_sync_at && (
                  <p className="mt-1">
                    <span className="font-medium">Last Sync:</span>{' '}
                    {format(new Date(connection.last_sync_at), 'PPp')}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConnectionDialogOpen(true)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Edit Connection
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  Sync Now
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Disconnect
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disconnect Zatzet OKR?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the integration connection. Previously imported goals will not be affected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteConnection()}>
                        Disconnect
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Zatzet OKR account to import Initiatives as Goals.
                Imported goals will appear in the Goal Marketplace for team assignment.
              </p>
              <Button onClick={() => setConnectionDialogOpen(true)}>
                <Link2 className="h-4 w-4 mr-2" />
                Configure Connection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ZatzetConnectionDialog
        open={connectionDialogOpen}
        onOpenChange={setConnectionDialogOpen}
        existingConnection={connection}
      />

      <ZatzetSyncPreviewDialog
        open={syncDialogOpen}
        onOpenChange={setSyncDialogOpen}
        initiatives={initiatives}
        onImport={handleImport}
        isImporting={isSyncing}
      />
    </div>
  );
};
