
import { User } from '@/types/userTypes';
import { Habit, Task, WeeklyPlan, WeeklyOutput } from '@/types/productivity';

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

  // Habits management methods
  async getHabits(userId: string): Promise<Habit[]> {
    try {
      const rows = await this.readSheet('Habits!A2:H1000');
      
      return rows
        .filter(row => row[1] === userId)
        .map((row, index) => ({
          id: row[0] || (index + 1).toString(),
          userId: row[1],
          name: row[2] || '',
          completed: row[3] === 'TRUE',
          streak: parseInt(row[4]) || 0,
          category: row[5] || '',
          archived: row[6] === 'TRUE',
          createdAt: row[7] || new Date().toISOString()
        }));
    } catch (error) {
      console.error('Error fetching habits:', error);
      return [];
    }
  }

  async addHabit(habit: Habit & { userId: string }): Promise<void> {
    try {
      const habits = await this.getHabits(habit.userId);
      const newRow = [
        habit.id,
        habit.userId,
        habit.name,
        habit.completed ? 'TRUE' : 'FALSE',
        habit.streak.toString(),
        habit.category || '',
        habit.archived ? 'TRUE' : 'FALSE',
        habit.createdAt || new Date().toISOString()
      ];

      if (habits.length === 0) {
        const header = ['ID', 'User ID', 'Name', 'Completed', 'Streak', 'Category', 'Archived', 'Created At'];
        await this.writeSheet('Habits!A1:H1', [header]);
      }

      const allHabits = await this.readSheet('Habits!A2:H1000');
      const nextRow = allHabits.length + 2;
      await this.writeSheet(`Habits!A${nextRow}:H${nextRow}`, [newRow]);
    } catch (error) {
      console.error('Error adding habit:', error);
      throw error;
    }
  }

  async updateHabit(habitId: string, userId: string, updates: Partial<Habit>): Promise<void> {
    try {
      const allRows = await this.readSheet('Habits!A2:H1000');
      const habitIndex = allRows.findIndex(row => row[0] === habitId && row[1] === userId);
      
      if (habitIndex === -1) {
        throw new Error('Habit not found');
      }

      const habit = allRows[habitIndex];
      const updatedHabit = {
        id: habit[0],
        userId: habit[1],
        name: updates.name !== undefined ? updates.name : habit[2],
        completed: updates.completed !== undefined ? updates.completed : habit[3] === 'TRUE',
        streak: updates.streak !== undefined ? updates.streak : parseInt(habit[4]) || 0,
        category: updates.category !== undefined ? updates.category : habit[5],
        archived: updates.archived !== undefined ? updates.archived : habit[6] === 'TRUE',
        createdAt: habit[7]
      };

      const updatedRow = [
        updatedHabit.id,
        updatedHabit.userId,
        updatedHabit.name,
        updatedHabit.completed ? 'TRUE' : 'FALSE',
        updatedHabit.streak.toString(),
        updatedHabit.category || '',
        updatedHabit.archived ? 'TRUE' : 'FALSE',
        updatedHabit.createdAt
      ];

      const rowIndex = habitIndex + 2;
      await this.writeSheet(`Habits!A${rowIndex}:H${rowIndex}`, [updatedRow]);
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  }

  // Tasks management methods
  async getTasks(userId: string): Promise<Task[]> {
    try {
      const rows = await this.readSheet('Tasks!A2:M1000');
      
      return rows
        .filter(row => row[1] === userId)
        .map((row, index) => ({
          id: row[0] || (index + 1).toString(),
          userId: row[1],
          title: row[2] || '',
          priority: row[3] || 'Medium',
          completed: row[4] === 'TRUE',
          estimatedTime: row[5] || '',
          createdDate: row[6] ? new Date(row[6]) : new Date(),
          dueDate: row[7] ? new Date(row[7]) : new Date(),
          originalDueDate: row[8] ? new Date(row[8]) : undefined,
          completedDate: row[9] ? new Date(row[9]) : undefined,
          isMoved: row[10] === 'TRUE',
          isDeleted: row[11] === 'TRUE',
          deletedDate: row[12] ? new Date(row[12]) : undefined
        }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  async addTask(task: Task & { userId: string }): Promise<void> {
    try {
      const newRow = [
        task.id,
        task.userId,
        task.title,
        task.priority,
        task.completed ? 'TRUE' : 'FALSE',
        task.estimatedTime || '',
        task.createdDate.toISOString(),
        task.dueDate.toISOString(),
        task.originalDueDate?.toISOString() || '',
        task.completedDate?.toISOString() || '',
        task.isMoved ? 'TRUE' : 'FALSE',
        task.isDeleted ? 'TRUE' : 'FALSE',
        task.deletedDate?.toISOString() || ''
      ];

      const allTasks = await this.readSheet('Tasks!A2:M1000');
      if (allTasks.length === 0) {
        const header = ['ID', 'User ID', 'Title', 'Priority', 'Completed', 'Estimated Time', 'Created Date', 'Due Date', 'Original Due Date', 'Completed Date', 'Is Moved', 'Is Deleted', 'Deleted Date'];
        await this.writeSheet('Tasks!A1:M1', [header]);
      }

      const nextRow = allTasks.length + 2;
      await this.writeSheet(`Tasks!A${nextRow}:M${nextRow}`, [newRow]);
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }

  async updateTask(taskId: string, userId: string, updates: Partial<Task>): Promise<void> {
    try {
      const allRows = await this.readSheet('Tasks!A2:M1000');
      const taskIndex = allRows.findIndex(row => row[0] === taskId && row[1] === userId);
      
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      const task = allRows[taskIndex];
      const updatedTask = {
        id: task[0],
        userId: task[1],
        title: updates.title !== undefined ? updates.title : task[2],
        priority: updates.priority !== undefined ? updates.priority : task[3],
        completed: updates.completed !== undefined ? updates.completed : task[4] === 'TRUE',
        estimatedTime: updates.estimatedTime !== undefined ? updates.estimatedTime : task[5],
        createdDate: updates.createdDate !== undefined ? updates.createdDate : new Date(task[6]),
        dueDate: updates.dueDate !== undefined ? updates.dueDate : new Date(task[7]),
        originalDueDate: updates.originalDueDate !== undefined ? updates.originalDueDate : (task[8] ? new Date(task[8]) : undefined),
        completedDate: updates.completedDate !== undefined ? updates.completedDate : (task[9] ? new Date(task[9]) : undefined),
        isMoved: updates.isMoved !== undefined ? updates.isMoved : task[10] === 'TRUE',
        isDeleted: updates.isDeleted !== undefined ? updates.isDeleted : task[11] === 'TRUE',
        deletedDate: updates.deletedDate !== undefined ? updates.deletedDate : (task[12] ? new Date(task[12]) : undefined)
      };

      const updatedRow = [
        updatedTask.id,
        updatedTask.userId,
        updatedTask.title,
        updatedTask.priority,
        updatedTask.completed ? 'TRUE' : 'FALSE',
        updatedTask.estimatedTime || '',
        updatedTask.createdDate.toISOString(),
        updatedTask.dueDate.toISOString(),
        updatedTask.originalDueDate?.toISOString() || '',
        updatedTask.completedDate?.toISOString() || '',
        updatedTask.isMoved ? 'TRUE' : 'FALSE',
        updatedTask.isDeleted ? 'TRUE' : 'FALSE',
        updatedTask.deletedDate?.toISOString() || ''
      ];

      const rowIndex = taskIndex + 2;
      await this.writeSheet(`Tasks!A${rowIndex}:M${rowIndex}`, [updatedRow]);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  // Weekly Outputs management methods
  async getWeeklyOutputs(userId: string): Promise<WeeklyOutput[]> {
    try {
      const rows = await this.readSheet('WeeklyOutputs!A2:L1000');
      
      return rows
        .filter(row => row[1] === userId)
        .map((row, index) => ({
          id: row[0] || (index + 1).toString(),
          userId: row[1],
          title: row[2] || '',
          progress: parseInt(row[3]) || 0,
          createdDate: row[4] ? new Date(row[4]) : new Date(),
          dueDate: row[5] ? new Date(row[5]) : new Date(),
          originalDueDate: row[6] ? new Date(row[6]) : undefined,
          completedDate: row[7] ? new Date(row[7]) : undefined,
          isMoved: row[8] === 'TRUE',
          isDeleted: row[9] === 'TRUE',
          deletedDate: row[10] ? new Date(row[10]) : undefined
        }));
    } catch (error) {
      console.error('Error fetching weekly outputs:', error);
      return [];
    }
  }

  async addWeeklyOutput(output: WeeklyOutput & { userId: string }): Promise<void> {
    try {
      const newRow = [
        output.id,
        output.userId,
        output.title,
        output.progress.toString(),
        output.createdDate.toISOString(),
        output.dueDate.toISOString(),
        output.originalDueDate?.toISOString() || '',
        output.completedDate?.toISOString() || '',
        output.isMoved ? 'TRUE' : 'FALSE',
        output.isDeleted ? 'TRUE' : 'FALSE',
        output.deletedDate?.toISOString() || ''
      ];

      const allOutputs = await this.readSheet('WeeklyOutputs!A2:L1000');
      if (allOutputs.length === 0) {
        const header = ['ID', 'User ID', 'Title', 'Progress', 'Created Date', 'Due Date', 'Original Due Date', 'Completed Date', 'Is Moved', 'Is Deleted', 'Deleted Date'];
        await this.writeSheet('WeeklyOutputs!A1:K1', [header]);
      }

      const nextRow = allOutputs.length + 2;
      await this.writeSheet(`WeeklyOutputs!A${nextRow}:K${nextRow}`, [newRow]);
    } catch (error) {
      console.error('Error adding weekly output:', error);
      throw error;
    }
  }

  async updateWeeklyOutput(outputId: string, userId: string, updates: Partial<WeeklyOutput>): Promise<void> {
    try {
      const allRows = await this.readSheet('WeeklyOutputs!A2:L1000');
      const outputIndex = allRows.findIndex(row => row[0] === outputId && row[1] === userId);
      
      if (outputIndex === -1) {
        throw new Error('Weekly output not found');
      }

      const output = allRows[outputIndex];
      const updatedOutput = {
        id: output[0],
        userId: output[1],
        title: updates.title !== undefined ? updates.title : output[2],
        progress: updates.progress !== undefined ? updates.progress : parseInt(output[3]) || 0,
        createdDate: updates.createdDate !== undefined ? updates.createdDate : new Date(output[4]),
        dueDate: updates.dueDate !== undefined ? updates.dueDate : new Date(output[5]),
        originalDueDate: updates.originalDueDate !== undefined ? updates.originalDueDate : (output[6] ? new Date(output[6]) : undefined),
        completedDate: updates.completedDate !== undefined ? updates.completedDate : (output[7] ? new Date(output[7]) : undefined),
        isMoved: updates.isMoved !== undefined ? updates.isMoved : output[8] === 'TRUE',
        isDeleted: updates.isDeleted !== undefined ? updates.isDeleted : output[9] === 'TRUE',
        deletedDate: updates.deletedDate !== undefined ? updates.deletedDate : (output[10] ? new Date(output[10]) : undefined)
      };

      const updatedRow = [
        updatedOutput.id,
        updatedOutput.userId,
        updatedOutput.title,
        updatedOutput.progress.toString(),
        updatedOutput.createdDate.toISOString(),
        updatedOutput.dueDate.toISOString(),
        updatedOutput.originalDueDate?.toISOString() || '',
        updatedOutput.completedDate?.toISOString() || '',
        updatedOutput.isMoved ? 'TRUE' : 'FALSE',
        updatedOutput.isDeleted ? 'TRUE' : 'FALSE',
        updatedOutput.deletedDate?.toISOString() || ''
      ];

      const rowIndex = outputIndex + 2;
      await this.writeSheet(`WeeklyOutputs!A${rowIndex}:K${rowIndex}`, [updatedRow]);
    } catch (error) {
      console.error('Error updating weekly output:', error);
      throw error;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
