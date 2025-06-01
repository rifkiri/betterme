
import { User } from '@/types/userTypes';

// Google Sheets API configuration
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'; // User will need to replace this

interface SheetsResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class GoogleSheetsService {
  private apiKey: string;
  private spreadsheetId: string;

  constructor() {
    // These will be set from localStorage or user input
    this.apiKey = localStorage.getItem('googleSheetsApiKey') || '';
    this.spreadsheetId = localStorage.getItem('googleSheetsId') || '';
  }

  // Configuration methods
  setCredentials(apiKey: string, spreadsheetId: string) {
    this.apiKey = apiKey;
    this.spreadsheetId = spreadsheetId;
    localStorage.setItem('googleSheetsApiKey', apiKey);
    localStorage.setItem('googleSheetsId', spreadsheetId);
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.spreadsheetId);
  }

  // Generic method to read data from a sheet
  private async readSheet(range: string): Promise<any[]> {
    if (!this.isConfigured()) {
      throw new Error('Google Sheets not configured');
    }

    try {
      const url = `${SHEETS_API_BASE}/${this.spreadsheetId}/values/${range}?key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
      const url = `${SHEETS_API_BASE}/${this.spreadsheetId}/values/${range}?valueInputOption=RAW&key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
}

// Create a singleton instance
export const googleSheetsService = new GoogleSheetsService();
