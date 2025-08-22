
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { googleSheetsService } from '@/services/GoogleSheetsService';
import { toast } from 'sonner';
import { Settings, Copy, AlertTriangle } from 'lucide-react';

export const GoogleSheetsConfig = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('googleSheetsApiKey') || '');
  const [spreadsheetId, setSpreadsheetId] = useState(localStorage.getItem('googleSheetsId') || '');
  const [isConfigured, setIsConfigured] = useState(googleSheetsService.isConfigured());

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleSaveConfig = () => {
    if (!apiKey || !spreadsheetId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      console.log('Saving Google Sheets API configuration...');
      googleSheetsService.setCredentials(apiKey, spreadsheetId);
      setIsConfigured(true);
      toast.success('Google Sheets configuration saved successfully');
      console.log('Configuration saved successfully');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error('Failed to save configuration');
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
      toast.error('Connection test failed. Please check your configuration.');
    }
  };

  const handleClearConfig = () => {
    googleSheetsService.clearConfig();
    setApiKey('');
    setSpreadsheetId('');
    setIsConfigured(false);
    toast.success('Configuration cleared');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Google Sheets API Configuration
        </CardTitle>
        <CardDescription>
          Connect your user management system to Google Sheets using API key authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Setup Requirements:</strong>
            <div className="mt-2 space-y-2 text-sm">
              <div>1. Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></div>
              <div>2. Create an API key (not OAuth2 client)</div>
              <div>3. Enable the Google Sheets API for your project</div>
              <div>4. Restrict the API key to Google Sheets API (recommended)</div>
              <div>5. Make sure your spreadsheet is shared publicly or with the service account</div>
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="api-key">Google Sheets API Key</Label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Google Sheets API Key"
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
          {isConfigured && (
            <Button variant="outline" onClick={handleTestConnection}>
              Test Connection
            </Button>
          )}
          {isConfigured && (
            <Button variant="destructive" onClick={handleClearConfig}>
              Clear Config
            </Button>
          )}
        </div>

        {isConfigured && (
          <Alert>
            <AlertDescription className="text-green-600">
              ✓ Google Sheets is configured with API key authentication
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <AlertDescription>
            <strong>API Key Setup Instructions:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Go to Google Cloud Console → APIs & Services → Credentials</li>
              <li>Click "Create Credentials" → "API Key"</li>
              <li>Copy the generated API key</li>
              <li>Click "Restrict Key" and select "Google Sheets API"</li>
              <li>Make sure your spreadsheet is publicly accessible or shared</li>
              <li>Paste the API key and spreadsheet ID above</li>
            </ol>
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm font-medium text-yellow-800">Important Notes:</p>
              <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                <li>• API key method is simpler but requires public spreadsheet access</li>
                <li>• Make sure Google Sheets API is enabled in your project</li>
                <li>• Consider restricting the API key to specific APIs for security</li>
                <li>• Your spreadsheet must be accessible to "Anyone with the link"</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
