
import { User } from '@/types/userTypes';

// Google Sheets API configuration
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const GOOGLE_AUTH_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
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
    // These will be set from localStorage or user input
    this.clientId = localStorage.getItem('googleClientId') || '';
    this.clientSecret = localStorage.getItem('googleClientSecret') || '';
    this.spreadsheetId = localStorage.getItem('googleSheetsId') || '';
    this.accessToken = localStorage.getItem('googleAccessToken') || '';
    this.refreshToken = localStorage.getItem('googleRefreshToken') || '';
    this.tokenExpiry = parseInt(localStorage.getItem('googleTokenExpiry') || '0');
  }

  // Configuration methods
  setCredentials(clientId: string, clientSecret: string, spreadsheetId: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.spreadsheetId = spreadsheetId;
    localStorage.setItem('googleClientId', clientId);
    localStorage.setItem('googleClientSecret', clientSecret);
    localStorage.setItem('googleSheetsId', spreadsheetId);
  }

  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret && this.spreadsheetId);
  }

  isAuthenticated(): boolean {
    return !!(this.accessToken && this.tokenExpiry > Date.now());
  }

  // OAuth2 Authentication Flow
  getAuthUrl(): string {
    const redirectUri = window.location.origin + '/oauth/callback';
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: GOOGLE_AUTH_SCOPE,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<void> {
    const redirectUri = window.location.origin + '/oauth/callback';
    
    try {
      const response = await fetch(GOOGLE_TOKEN_URL, {
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
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const tokens: TokenResponse = await response.json();
      
      this.accessToken = tokens.access_token;
      this.tokenExpiry = Date.now() + (tokens.expires_in * 1000);
      
      if (tokens.refresh_token) {
        this.refreshToken = tokens.refresh_token;
        localStorage.setItem('googleRefreshToken', this.refreshToken);
      }

      localStorage.setItem('googleAccessToken', this.accessToken);
      localStorage.setItem('googleTokenExpiry', this.tokenExpiry.toString());
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const tokens: TokenResponse = await response.json();
      
      this.accessToken = tokens.access_token;
      this.tokenExpiry = Date.now() + (tokens.expires_in * 1000);

      localStorage.setItem('googleAccessToken', this.accessToken);
      localStorage.setItem('googleTokenExpiry', this.tokenExpiry.toString());
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.isAuthenticated() && this.refreshToken) {
      await this.refreshAccessToken();
    }
    
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required. Please re-authenticate.');
    }
  }

  private async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    await this.ensureValidToken();

    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token might be expired, try to refresh
      if (this.refreshToken) {
        await this.refreshAccessToken();
        // Retry the request with new token
        return fetch(url, {
          ...options,
          headers: {
            ...headers,
            'Authorization': `Bearer ${this.accessToken}`,
          },
        });
      }
    }

    return response;
  }

  // Generic method to read data from a sheet
  private async readSheet(range: string): Promise<any[]> {
    if (!this.isConfigured()) {
      throw new Error('Google Sheets not configured');
    }

    try {
      const url = `${SHEETS_API_BASE}/${this.spreadsheetId}/values/${range}`;
      const response = await this.makeAuthenticatedRequest(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error reading sheet:', error);
      throw error;
    }
  }

  // Generic method to write data to a sheet
  private async writeSheet(range: string, values: any[][]): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Google Sheets not configured');
    }

    try {
      const url = `${SHEETS_API_BASE}/${this.spreadsheetId}/values/${range}?valueInputOption=RAW`;
      const response = await this.makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify({
          values: values
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error writing to sheet:', error);
      throw error;
    }
  }

  // User management methods
  async getUsers(): Promise<User[]> {
    try {
      const rows = await this.readSheet('Users!A2:L1000'); // Skip header row
      
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

      // Add header if this is the first user
      if (users.length === 0) {
        const header = ['ID', 'Name', 'Email', 'Role', 'Position', 'Department', 'Manager', 'Temp Password', 'Password Changed', 'Created At', 'Last Login'];
        await this.writeSheet('Users!A1:K1', [header]);
      }

      const nextRow = users.length + 2; // +1 for header, +1 for next row
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
      const rowIndex = userIndex + 2; // +1 for header, +1 for 0-based to 1-based

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
      
      // Clear the sheet and rewrite with filtered data
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

  // Logout method
  logout(): void {
    this.accessToken = '';
    this.refreshToken = '';
    this.tokenExpiry = 0;
    localStorage.removeItem('googleAccessToken');
    localStorage.removeItem('googleRefreshToken');
    localStorage.removeItem('googleTokenExpiry');
  }
}

// Create a singleton instance
export const googleSheetsService = new GoogleSheetsService();
