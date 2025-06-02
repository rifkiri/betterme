
import { googleOAuthService } from './GoogleOAuthService';

export abstract class BaseGoogleSheetsService {
  protected getApiKey(): string | null {
    return googleOAuthService.getApiKey();
  }

  protected getSpreadsheetId(): string | null {
    return googleOAuthService.getSpreadsheetId();
  }

  isAuthenticated(): boolean {
    return googleOAuthService.isAuthenticated();
  }

  isConfigured(): boolean {
    return googleOAuthService.isConfigured();
  }

  protected async makeRequest(endpoint: string, options: RequestInit = {}) {
    const apiKey = this.getApiKey();
    const spreadsheetId = this.getSpreadsheetId();
    
    if (!apiKey || !spreadsheetId) {
      throw new Error('API key or spreadsheet not configured');
    }

    // Add API key to the URL
    const separator = endpoint.includes('?') ? '&' : '?';
    const urlWithKey = `${endpoint}${separator}key=${apiKey}`;

    const response = await fetch(urlWithKey, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }
}
