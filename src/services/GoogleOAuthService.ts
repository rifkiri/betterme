
class GoogleSheetsApiService {
  private apiKey: string | null = null;
  private spreadsheetId: string | null = null;

  constructor() {
    this.loadConfig();
  }

  setCredentials(apiKey: string, spreadsheetId: string) {
    this.apiKey = apiKey;
    this.spreadsheetId = spreadsheetId;
    
    localStorage.setItem('googleSheetsApiKey', apiKey);
    localStorage.setItem('googleSheetsId', spreadsheetId);
  }

  loadConfig() {
    this.apiKey = localStorage.getItem('googleSheetsApiKey');
    this.spreadsheetId = localStorage.getItem('googleSheetsId');
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.spreadsheetId);
  }

  isAuthenticated(): boolean {
    // With API key, if it's configured, it's authenticated
    return this.isConfigured();
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  getSpreadsheetId(): string | null {
    return this.spreadsheetId;
  }

  clearConfig() {
    this.apiKey = null;
    this.spreadsheetId = null;
    localStorage.removeItem('googleSheetsApiKey');
    localStorage.removeItem('googleSheetsId');
    // Clean up old OAuth config if it exists
    localStorage.removeItem('googleSheetsConfig');
    localStorage.removeItem('googleOAuthClientId');
    localStorage.removeItem('googleOAuthClientSecret');
  }
}

export const googleOAuthService = new GoogleSheetsApiService();
