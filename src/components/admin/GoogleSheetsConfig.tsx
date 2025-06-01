
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { googleSheetsService } from '@/services/GoogleSheetsService';
import { toast } from 'sonner';
import { Settings, ExternalLink, Shield } from 'lucide-react';

export const GoogleSheetsConfig = () => {
  const [clientId, setClientId] = useState(localStorage.getItem('googleOAuthClientId') || '');
  const [clientSecret, setClientSecret] = useState(localStorage.getItem('googleOAuthClientSecret') || '');
  const [spreadsheetId, setSpreadsheetId] = useState(localStorage.getItem('googleSheetsId') || '');
  const [isConfigured, setIsConfigured] = useState(googleSheetsService.isConfigured());
  const [isAuthenticated, setIsAuthenticated] = useState(googleSheetsService.isAuthenticated());

  const handleSaveConfig = () => {
    if (!clientId || !clientSecret || !spreadsheetId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      googleSheetsService.setCredentials(clientId, clientSecret, spreadsheetId);
      setIsConfigured(true);
      toast.success('Google Sheets configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save configuration');
    }
  };

  const handleAuthenticate = () => {
    if (!isConfigured) {
      toast.error('Please save configuration first');
      return;
    }

    try {
      const authUrl = googleSheetsService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      toast.error('Failed to start authentication');
    }
  };

  const handleTestConnection = async () => {
    try {
      await googleSheetsService.getUsers();
      toast.success('Connection test successful!');
    } catch (error) {
      toast.error('Connection test failed. Please check your configuration and authentication.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Google Sheets OAuth2 Configuration
        </CardTitle>
        <CardDescription>
          Connect your user management system to Google Sheets with OAuth2 authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            You'll need to create OAuth2 credentials in Google Cloud Console. 
            <a 
              href="https://console.cloud.google.com/apis/credentials" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline ml-1"
            >
              Go to Google Cloud Console <ExternalLink className="h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="client-id">OAuth2 Client ID</Label>
          <Input
            id="client-id"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Enter your OAuth2 Client ID"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-secret">OAuth2 Client Secret</Label>
          <Input
            id="client-secret"
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder="Enter your OAuth2 Client Secret"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="spreadsheet-id">Spreadsheet ID</Label>
          <Input
            id="spreadsheet-id"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
            placeholder="Enter your Google Spreadsheet ID"
          />
          <p className="text-xs text-muted-foreground">
            Found in the URL: https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSaveConfig}>
            Save Configuration
          </Button>
          {isConfigured && !isAuthenticated && (
            <Button variant="outline" onClick={handleAuthenticate}>
              <Shield className="h-4 w-4 mr-2" />
              Authenticate with Google
            </Button>
          )}
          {isAuthenticated && (
            <Button variant="outline" onClick={handleTestConnection}>
              Test Connection
            </Button>
          )}
        </div>

        {isConfigured && (
          <Alert>
            <AlertDescription className={isAuthenticated ? "text-green-600" : "text-yellow-600"}>
              {isAuthenticated ? (
                <>✓ Google Sheets is configured and authenticated</>
              ) : (
                <>⚠ Configuration saved. Please authenticate with Google to enable write access.</>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <AlertDescription>
            <strong>Setup Instructions:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
              <li>Create a new "Web application" OAuth 2.0 client</li>
              <li>Add <code className="bg-gray-100 px-1 rounded">{window.location.origin}/oauth/callback</code> to authorized redirect URIs</li>
              <li>Enable the Google Sheets API in your project</li>
              <li>Copy the Client ID and Client Secret here</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
