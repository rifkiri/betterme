
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { googleSheetsService } from '@/services/GoogleSheetsService';
import { toast } from 'sonner';
import { Settings, ExternalLink } from 'lucide-react';

export const GoogleSheetsConfig = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('googleSheetsApiKey') || '');
  const [spreadsheetId, setSpreadsheetId] = useState(localStorage.getItem('googleSheetsId') || '');
  const [isConfigured, setIsConfigured] = useState(googleSheetsService.isConfigured());

  const handleSaveConfig = () => {
    if (!apiKey || !spreadsheetId) {
      toast.error('Please fill in both API key and spreadsheet ID');
      return;
    }

    try {
      googleSheetsService.setCredentials(apiKey, spreadsheetId);
      setIsConfigured(true);
      toast.success('Google Sheets configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save configuration');
    }
  };

  const handleTestConnection = async () => {
    try {
      await googleSheetsService.getUsers();
      toast.success('Connection test successful!');
    } catch (error) {
      toast.error('Connection test failed. Please check your configuration.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Google Sheets Configuration
        </CardTitle>
        <CardDescription>
          Connect your user management system to Google Sheets for data storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            You'll need to create a Google Sheets API key and prepare a spreadsheet. 
            <a 
              href="https://developers.google.com/sheets/api/quickstart" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline ml-1"
            >
              Follow this guide <ExternalLink className="h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="api-key">Google Sheets API Key</Label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Google Sheets API key"
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
        </div>

        {isConfigured && (
          <Alert>
            <AlertDescription className="text-green-600">
              ✓ Google Sheets is configured and ready to use
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
