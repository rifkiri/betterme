
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { googleSheetsService } from '@/services/GoogleSheetsService';
import { toast } from 'sonner';
import { Settings, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

export const GoogleSheetsConfig = () => {
  const [clientId, setClientId] = useState(localStorage.getItem('googleClientId') || '');
  const [clientSecret, setClientSecret] = useState(localStorage.getItem('googleClientSecret') || '');
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
      window.open(authUrl, 'google-auth', 'width=500,height=600');
      
      // Listen for the auth callback
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          googleSheetsService.exchangeCodeForTokens(event.data.code)
            .then(() => {
              setIsAuthenticated(true);
              toast.success('Authentication successful!');
            })
            .catch((error) => {
              toast.error('Authentication failed: ' + error.message);
            });
          
          window.removeEventListener('message', handleMessage);
        }
      };
      
      window.addEventListener('message', handleMessage);
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

  const handleLogout = () => {
    googleSheetsService.logout();
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Google Sheets OAuth2 Configuration
        </CardTitle>
        <CardDescription>
          Connect your user management system to Google Sheets using OAuth2 authentication
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

        <div className="space-y-4">
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
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleSaveConfig}>
            Save Configuration
          </Button>
          
          {isConfigured && !isAuthenticated && (
            <Button variant="outline" onClick={handleAuthenticate}>
              Authenticate with Google
            </Button>
          )}
          
          {isAuthenticated && (
            <>
              <Button variant="outline" onClick={handleTestConnection}>
                Test Connection
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}
        </div>

        {isConfigured && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-600">
              ✓ OAuth2 credentials configured
            </AlertDescription>
          </Alert>
        )}

        {isAuthenticated && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-600">
              ✓ Authenticated with Google Sheets - Full read/write access enabled
            </AlertDescription>
          </Alert>
        )}

        {isConfigured && !isAuthenticated && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-orange-600">
              ⚠ Authentication required for write operations
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-sm text-blue-900 mb-2">Setup Instructions:</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <p>1. Go to Google Cloud Console → APIs & Services → Credentials</p>
            <p>2. Create OAuth 2.0 Client ID (Web application)</p>
            <p>3. Add authorized redirect URI: {window.location.origin}/oauth/callback</p>
            <p>4. Enable Google Sheets API in your project</p>
            <p>5. Copy the Client ID and Client Secret here</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
