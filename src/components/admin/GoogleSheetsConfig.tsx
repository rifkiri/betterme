
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { googleSheetsService } from '@/services/GoogleSheetsService';
import { toast } from 'sonner';
import { Settings, ExternalLink, Shield, Copy, AlertTriangle } from 'lucide-react';

export const GoogleSheetsConfig = () => {
  const [clientId, setClientId] = useState(localStorage.getItem('googleOAuthClientId') || '');
  const [clientSecret, setClientSecret] = useState(localStorage.getItem('googleOAuthClientSecret') || '');
  const [spreadsheetId, setSpreadsheetId] = useState(localStorage.getItem('googleSheetsId') || '');
  const [isConfigured, setIsConfigured] = useState(googleSheetsService.isConfigured());
  const [isAuthenticated, setIsAuthenticated] = useState(googleSheetsService.isAuthenticated());

  const redirectUri = `${window.location.origin}/oauth/callback`;
  const currentOrigin = window.location.origin;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleSaveConfig = () => {
    if (!clientId || !clientSecret || !spreadsheetId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      console.log('Saving Google Sheets configuration...');
      googleSheetsService.setCredentials(clientId, clientSecret, spreadsheetId);
      setIsConfigured(true);
      toast.success('Google Sheets configuration saved successfully');
      console.log('Configuration saved, checking authentication status...');
      setIsAuthenticated(googleSheetsService.isAuthenticated());
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error('Failed to save configuration');
    }
  };

  const handleAuthenticate = () => {
    if (!isConfigured) {
      toast.error('Please save configuration first');
      return;
    }

    try {
      console.log('Starting OAuth flow...');
      console.log('Current origin:', currentOrigin);
      console.log('Redirect URI:', redirectUri);
      
      const authUrl = googleSheetsService.getAuthUrl();
      console.log('Generated auth URL:', authUrl);
      
      // Add detailed logging for debugging
      console.log('OAuth Configuration Check:');
      console.log('- Client ID:', clientId ? `${clientId.substring(0, 20)}...` : 'Not set');
      console.log('- Current domain:', window.location.hostname);
      console.log('- Protocol:', window.location.protocol);
      
      // Check if we're on localhost or a development environment
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
        toast.error('OAuth authentication requires a proper domain. Development servers may not work with Google OAuth.');
        return;
      }
      
      // Open in same window to avoid popup blockers
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to start authentication:', error);
      toast.error('Failed to start authentication - check console for details');
    }
  };

  const handleTestConnection = async () => {
    try {
      console.log('Testing Google Sheets connection...');
      await googleSheetsService.getUsers();
      toast.success('Connection test successful!');
      console.log('Connection test passed');
    } catch (error) {
      console.error('Connection test failed:', error);
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
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important Setup Requirements:</strong>
            <div className="mt-2 space-y-2 text-sm">
              <div>
                <strong>1. Authorized JavaScript Origins:</strong>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">{currentOrigin}</code>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(currentOrigin)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <strong>2. Authorized Redirect URIs:</strong>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">{redirectUri}</code>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(redirectUri)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            <p className="mt-2 text-sm">
              Add BOTH URLs above to your OAuth2 client in Google Cloud Console.
            </p>
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
              <li>Add the JavaScript origin and redirect URI shown above</li>
              <li>Enable the Google Sheets API in your project</li>
              <li>Copy the Client ID and Client Secret here</li>
              <li>Click "Save Configuration" then "Authenticate with Google"</li>
            </ol>
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm font-medium text-yellow-800">Common Issues:</p>
              <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                <li>• Make sure both JavaScript origins AND redirect URIs are added</li>
                <li>• Verify the OAuth client type is "Web application"</li>
                <li>• Ensure Google Sheets API is enabled</li>
                <li>• Check browser console for detailed error messages</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
