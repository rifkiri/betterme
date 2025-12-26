import React, { useState, useEffect } from 'react';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useZatzetIntegration } from '@/hooks/useZatzetIntegration';
import { IntegrationConnection, DEFAULT_ZATZET_ENDPOINT } from '@/types/integration';

interface ZatzetConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingConnection?: IntegrationConnection | null;
}

export const ZatzetConnectionDialog: React.FC<ZatzetConnectionDialogProps> = ({
  open,
  onOpenChange,
  existingConnection,
}) => {
  const [apiEndpoint, setApiEndpoint] = useState(DEFAULT_ZATZET_ENDPOINT);
  const [apiKey, setApiKey] = useState('');
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const { testConnection, saveConnection, isTesting, isLoading } = useZatzetIntegration();

  useEffect(() => {
    if (open && existingConnection) {
      setApiEndpoint(existingConnection.api_endpoint);
      setApiKey(existingConnection.api_key_encrypted || '');
    } else if (open && !existingConnection) {
      setApiEndpoint(DEFAULT_ZATZET_ENDPOINT);
      setApiKey('');
    }
    setTestResult(null);
  }, [open, existingConnection]);

  const handleTestConnection = async () => {
    setTestResult(null);
    const result = await testConnection(apiEndpoint, apiKey);
    setTestResult(result.success ? 'success' : 'error');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      return;
    }

    const result = await saveConnection(apiEndpoint, apiKey);
    if (result.success) {
      onOpenChange(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Configure Zatzet OKR Connection"
      description="Enter your Zatzet OKR API credentials to enable integration"
      onSubmit={handleSubmit}
      submitText="Save Connection"
      isSubmitting={isLoading}
      submitDisabled={!apiKey.trim()}
    >
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="api-endpoint">API Endpoint</Label>
          <Input
            id="api-endpoint"
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
            placeholder="https://api.zatzet.com"
          />
          <p className="text-xs text-muted-foreground">
            The base URL for the Zatzet OKR API
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setTestResult(null);
            }}
            placeholder="Enter your API key"
          />
          <p className="text-xs text-muted-foreground">
            Your Zatzet OKR API key for authentication
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleTestConnection}
            disabled={!apiKey.trim() || isTesting}
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
          
          {testResult === 'success' && (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="h-4 w-4 mr-1" />
              Connection successful
            </div>
          )}
          
          {testResult === 'error' && (
            <div className="flex items-center text-destructive text-sm">
              <XCircle className="h-4 w-4 mr-1" />
              Connection failed
            </div>
          )}
        </div>
      </div>
    </FormDialog>
  );
};
