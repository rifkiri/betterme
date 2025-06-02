
class GoogleOAuthService {
  private clientId: string | null = null;
  private clientSecret: string | null = null;
  private spreadsheetId: string | null = null;
  private accessToken: string | null = null;

  constructor() {
    this.loadConfig();
  }

  setCredentials(clientId: string, clientSecret: string, spreadsheetId: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.spreadsheetId = spreadsheetId;
    
    localStorage.setItem('googleOAuthClientId', clientId);
    localStorage.setItem('googleOAuthClientSecret', clientSecret);
    localStorage.setItem('googleSheetsId', spreadsheetId);
  }

  getAuthUrl(): string {
    if (!this.clientId) {
      throw new Error('OAuth client ID not configured');
    }

    const redirectUri = `${window.location.origin}/oauth/callback`;
    const scope = 'https://www.googleapis.com/auth/spreadsheets';
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: scope,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('OAuth credentials not configured');
    }

    const redirectUri = `${window.location.origin}/oauth/callback`;
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    
    localStorage.setItem('googleSheetsConfig', JSON.stringify({ 
      accessToken: this.accessToken, 
      spreadsheetId: this.spreadsheetId 
    }));
  }

  configure(accessToken: string, spreadsheetId: string) {
    this.accessToken = accessToken;
    this.spreadsheetId = spreadsheetId;
    localStorage.setItem('googleSheetsConfig', JSON.stringify({ accessToken, spreadsheetId }));
  }

  loadConfig() {
    this.clientId = localStorage.getItem('googleOAuthClientId');
    this.clientSecret = localStorage.getItem('googleOAuthClientSecret');
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

  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret && this.spreadsheetId);
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  clearConfig() {
    this.accessToken = null;
    this.spreadsheetId = null;
    this.clientId = null;
    this.clientSecret = null;
    localStorage.removeItem('googleSheetsConfig');
    localStorage.removeItem('googleOAuthClientId');
    localStorage.removeItem('googleOAuthClientSecret');
    localStorage.removeItem('googleSheetsId');
  }
}

export const googleOAuthService = new GoogleOAuthService();
