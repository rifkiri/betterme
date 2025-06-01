import { User } from '@/types/userTypes';

// Google Sheets API configuration
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export class GoogleSheetsService {
  private clientId: string;
  private clientSecret: string;
  private spreadsheetId: string;
  private accessToken: string;
  private refreshToken: string;
  private tokenExpiry: number;

  constructor() {
    this.clientId = localStorage.getItem('googleOAuthClientId') || '';
    this.clientSecret = localStorage.getItem('googleOAuthClientSecret') || '';
    this.spreadsheetId = localStorage.getItem('googleSheetsId') || '';
    this.accessToken = localStorage.getItem('googleAccessToken') || '';
    this.refreshToken = localStorage.getItem('googleRefreshToken') || '';
    this.tokenExpiry = parseInt(localStorage.getItem('googleTokenExpiry') || '0');
  }

  // Configuration methods
  setCredentials(clientId: string, clientSecret: string, spreadsheetId: string) {
    console.log('Setting Google Sheets credentials...');
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.spreadsheetId = spreadsheetId;
    localStorage.setItem('googleOAuthClientId', clientId);
    localStorage.setItem('googleOAuthClientSecret', clientSecret);
    localStorage.setItem('googleSheetsId', spreadsheetId);
    console.log('Credentials saved to localStorage');
  }

  isConfigured(): boolean {
    const configured = !!(this.clientId && this.clientSecret && this.spreadsheetId);
    console.log('Configuration status:', { 
      configured, 
      hasClientId: !!this.clientId, 
      hasClientSecret: !!this.clientSecret, 
      hasSpreadsheetId: !!this.spreadsheetId 
    });
    return configured;
  }

  isAuthenticated(): boolean {
    const authenticated = !!(this.accessToken && Date.now() < this.tokenExpiry);
    console.log('Authentication status:', { 
      authenticated, 
      hasAccessToken: !!this.accessToken, 
      tokenExpiry: new Date(this.tokenExpiry).toISOString(),
      isExpired: Date.now() >= this.tokenExpiry
    });
    return authenticated;
  }

  // OAuth2 flow methods
  getAuthUrl(): string {
    if (!this.isConfigured()) {
      throw new Error('Google Sheets not configured. Please set credentials first.');
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

    const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
    console.log('Generated auth URL with params:', Object.fromEntries(params.entries()));
    return authUrl;
  }

  async exchangeCodeForTokens(code: string): Promise<void> {
    console.log('Exchanging authorization code for tokens...');
    const redirectUri = `${window.location.origin}/oauth/callback`;
    
    const requestBody = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    };

    console.log('Token request params:', { ...requestBody, client_secret: '[REDACTED]', code: code.substring(0, 10) + '...' });

    try {
      const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(requestBody)
      });

      console.log('Token response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange failed:', errorText);
        throw new Error(`Failed to exchange code for tokens: ${response.status} ${errorText}`);
      }

      const tokens: TokenResponse = await response.json();
      console.log('Received tokens:', { 
        access_token: tokens.access_token.substring(0, 10) + '...', 
        has_refresh_token: !!tokens.refresh_token,
        expires_in: tokens.expires_in
      });
      
      this.accessToken = tokens.access_token;
      this.tokenExpiry = Date.now() + (tokens.expires_in * 1000);
      
      if (tokens.refresh_token) {
        this.refreshToken = tokens.refresh_token;
        localStorage.setItem('googleRefreshToken', this.refreshToken);
      }

      localStorage.setItem('googleAccessToken', this.accessToken);
      localStorage.setItem('googleTokenExpiry', this.tokenExpiry.toString());
      console.log('Tokens saved successfully');
    } catch (error) {
      console.error('Error during token exchange:', error);
      throw error;
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const tokens: TokenResponse = await response.json();
    
    this.accessToken = tokens.access_token;
    this.tokenExpiry = Date.now() + (tokens.expires_in * 1000);

    localStorage.setItem('googleAccessToken', this.accessToken);
    localStorage.setItem('googleTokenExpiry', this.tokenExpiry.toString());
  }

  private async getValidAccessToken(): Promise<string> {
    if (Date.now() >= this.tokenExpiry) {
      await this.refreshAccessToken();
    }
    return this.accessToken;
  }

  // API methods
  private async makeAuthorizedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getValidAccessToken();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }

  private async readSheet(range: string): Promise<any[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google');
    }

    try {
      const url = `${SHEETS_API_BASE}/${this.spreadsheetId}/values/${range}`;
      const response = await this.makeAuthorizedRequest(url);
      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error reading sheet:', error);
      throw error;
    }
  }

  private async writeSheet(range: string, values: any[][]): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google');
    }

    try {
      const url = `${SHEETS_API_BASE}/${this.spreadsheetId}/values/${range}?valueInputOption=RAW`;
      await this.makeAuthorizedRequest(url, {
        method: 'PUT',
        body: JSON.stringify({ values })
      });
    } catch (error) {
      console.error('Error writing to sheet:', error);
      throw error;
    }
  }

  // User management methods
  async getUsers(): Promise<User[]> {
    try {
      const rows = await this.readSheet('Users!A2:L1000');
      
      return rows.map((row, index) => ({
        id: row[0] || (index + 1).toString(),
        name: row[1] || '',
        email: row[2] || '',
        role: (row[3] as any) || 'team-member',
        position: row[4] || undefined,
        department: row[5] || undefined,
        manager: row[6] || undefined,
        temporaryPassword: row[7] || undefined,
        hasChangedPassword: row[8] === 'TRUE',
        createdAt: row[9] || new Date().toISOString().split('T')[0],
        lastLogin: row[10] || undefined
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async addUser(user: User): Promise<void> {
    try {
      const users = await this.getUsers();
      const newRow = [
        user.id,
        user.name,
        user.email,
        user.role,
        user.position || '',
        user.department || '',
        user.manager || '',
        user.temporaryPassword || '',
        user.hasChangedPassword ? 'TRUE' : 'FALSE',
        user.createdAt,
        user.lastLogin || ''
      ];

      if (users.length === 0) {
        const header = ['ID', 'Name', 'Email', 'Role', 'Position', 'Department', 'Manager', 'Temp Password', 'Password Changed', 'Created At', 'Last Login'];
        await this.writeSheet('Users!A1:K1', [header]);
      }

      const nextRow = users.length + 2;
      await this.writeSheet(`Users!A${nextRow}:K${nextRow}`, [newRow]);
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const users = await this.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      const updatedUser = { ...users[userIndex], ...updates };
      const rowIndex = userIndex + 2;

      const updatedRow = [
        updatedUser.id,
        updatedUser.name,
        updatedUser.email,
        updatedUser.role,
        updatedUser.position || '',
        updatedUser.department || '',
        updatedUser.manager || '',
        updatedUser.temporaryPassword || '',
        updatedUser.hasChangedPassword ? 'TRUE' : 'FALSE',
        updatedUser.createdAt,
        updatedUser.lastLogin || ''
      ];

      await this.writeSheet(`Users!A${rowIndex}:K${rowIndex}`, [updatedRow]);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const users = await this.getUsers();
      const filteredUsers = users.filter(u => u.id !== userId);
      
      await this.writeSheet('Users!A1:K1000', []);
      
      if (filteredUsers.length > 0) {
        const header = ['ID', 'Name', 'Email', 'Role', 'Position', 'Department', 'Manager', 'Temp Password', 'Password Changed', 'Created At', 'Last Login'];
        const rows = [header, ...filteredUsers.map(user => [
          user.id,
          user.name,
          user.email,
          user.role,
          user.position || '',
          user.department || '',
          user.manager || '',
          user.temporaryPassword || '',
          user.hasChangedPassword ? 'TRUE' : 'FALSE',
          user.createdAt,
          user.lastLogin || ''
        ])];
        
        await this.writeSheet(`Users!A1:K${rows.length}`, rows);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
