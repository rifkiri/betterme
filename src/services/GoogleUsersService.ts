
import { BaseGoogleSheetsService } from './BaseGoogleSheetsService';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'team-member';
  temporaryPassword: string;
  createdAt: string;
  lastLogin?: string;
}

class GoogleUsersService extends BaseGoogleSheetsService {
  async getUsers(): Promise<User[]> {
    if (!this.isAuthenticated() || !this.spreadsheetId) {
      return [];
    }

    try {
      const data = await this.makeRequest(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Users`
      );

      const rows = data.values || [];
      return rows.slice(1).map((row: string[]) => ({
        id: row[0] || '',
        name: row[1] || '',
        email: row[2] || '',
        role: row[3] as 'admin' | 'manager' | 'team-member',
        temporaryPassword: row[4] || '',
        createdAt: row[5] || '',
        lastLogin: row[6] || undefined,
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async addUser(user: User) {
    const values = [[
      user.id,
      user.name,
      user.email,
      user.role,
      user.temporaryPassword,
      user.createdAt,
      user.lastLogin || ''
    ]];

    return await this.makeRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Users:append?valueInputOption=RAW`,
      {
        method: 'POST',
        body: JSON.stringify({ values }),
      }
    );
  }

  async updateUser(userId: string, updates: Partial<User>) {
    const users = await this.getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const existingUser = users[userIndex];
    const updatedUser = { ...existingUser, ...updates };

    const values = [[
      updatedUser.id,
      updatedUser.name,
      updatedUser.email,
      updatedUser.role,
      updatedUser.temporaryPassword,
      updatedUser.createdAt,
      updatedUser.lastLogin || ''
    ]];

    const rowNumber = userIndex + 2;
    return await this.makeRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Users!A${rowNumber}:G${rowNumber}?valueInputOption=RAW`,
      {
        method: 'PUT',
        body: JSON.stringify({ values }),
      }
    );
  }

  async deleteUser(userId: string) {
    const users = await this.getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const rowNumber = userIndex + 2;
    return await this.makeRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        body: JSON.stringify({
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 0,
                dimension: 'ROWS',
                startIndex: rowNumber - 1,
                endIndex: rowNumber
              }
            }
          }]
        }),
      }
    );
  }
}

export const googleUsersService = new GoogleUsersService();
