
export abstract class BaseGoogleSheetsService {
  protected accessToken: string | null = null;
  protected spreadsheetId: string | null = null;

  constructor() {
    this.loadConfig();
  }

  protected loadConfig() {
    this.spreadsheetId = localStorage.getItem('googleSheetsId');
    const config = localStorage.getItem('googleSheetsConfig');
    if (config) {
      const { accessToken, spreadsheetId } = JSON.parse(config);
      this.accessToken = accessToken;
      if (!this.spreadsheetId) {
        this.spreadsheetId = spreadsheetId;
      }
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  isConfigured(): boolean {
    return !!this.spreadsheetId;
  }

  protected async makeRequest(endpoint: string, options: RequestInit = {}) {
    if (!this.isAuthenticated() || !this.spreadsheetId) {
      throw new Error('Not authenticated or spreadsheet not configured');
    }

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
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
