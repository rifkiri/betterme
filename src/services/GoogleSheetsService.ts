import { Habit, Task, WeeklyOutput } from '@/types/productivity';

interface MoodEntry {
  id: string;
  userId: string;
  date: string;
  mood: number;
  notes?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'team-member';
  temporaryPassword: string;
  createdAt: string;
  lastLogin?: string;
}

class GoogleSheetsService {
  private accessToken: string | null = null;
  private spreadsheetId: string | null = null;
  private clientId: string | null = null;
  private clientSecret: string | null = null;

  constructor() {
    this.loadConfig();
  }

  setCredentials(clientId: string, clientSecret: string, spreadsheetId: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.spreadsheetId = spreadsheetId;
    
    // Store credentials in localStorage
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
    
    // Store the access token
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
    // Load OAuth credentials
    this.clientId = localStorage.getItem('googleOAuthClientId');
    this.clientSecret = localStorage.getItem('googleOAuthClientSecret');
    this.spreadsheetId = localStorage.getItem('googleSheetsId');

    // Load access token
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

  // User Management methods
  async getUsers(): Promise<User[]> {
    if (!this.isAuthenticated() || !this.spreadsheetId) {
      return [];
    }

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Users`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch users:', response.status);
        return [];
      }

      const data = await response.json();
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
    if (!this.isAuthenticated() || !this.spreadsheetId) {
      throw new Error('Not authenticated or spreadsheet not configured');
    }

    try {
      const values = [[
        user.id,
        user.name,
        user.email,
        user.role,
        user.temporaryPassword,
        user.createdAt,
        user.lastLogin || ''
      ]];

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Users:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add user: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<User>) {
    if (!this.isAuthenticated() || !this.spreadsheetId) {
      throw new Error('Not authenticated or spreadsheet not configured');
    }

    try {
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
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Users!A${rowNumber}:G${rowNumber}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update user: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    if (!this.isAuthenticated() || !this.spreadsheetId) {
      throw new Error('Not authenticated or spreadsheet not configured');
    }

    try {
      const users = await this.getUsers();
      const userIndex = users.findIndex(user => user.id === userId);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      const rowNumber = userIndex + 2;
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: 0, // Assuming Users sheet is the first sheet
                  dimension: 'ROWS',
                  startIndex: rowNumber - 1,
                  endIndex: rowNumber
                }
              }
            }]
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete user: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Habits methods
  async getHabits(userId: string): Promise<Habit[]> {
    if (!this.isAuthenticated() || !this.spreadsheetId) {
      return [];
    }

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Habits`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch habits:', response.status);
        return [];
      }

      const data = await response.json();
      const rows = data.values || [];

      // Skip header row and filter by userId
      return rows.slice(1)
        .filter((row: string[]) => row[1] === userId) // Filter by userId
        .map((row: string[]) => ({
          id: row[0] || '',
          name: row[2] || '',
          description: row[3] || '',
          completed: row[4] === 'TRUE',
          streak: parseInt(row[5]) || 0,
          category: row[6] || '',
          archived: row[7] === 'TRUE',
          isDeleted: row[8] === 'TRUE',
          createdAt: row[9] || '',
        }));
    } catch (error) {
      console.error('Error fetching habits:', error);
      return [];
    }
  }

  async addHabit(habit: Habit & { userId: string }) {
    if (!this.isAuthenticated() || !this.spreadsheetId) {
      throw new Error('Not authenticated or spreadsheet not configured');
    }

    try {
      const values = [[
        habit.id,
        habit.userId,
        habit.name,
        habit.description || '',
        habit.completed ? 'TRUE' : 'FALSE',
        habit.streak.toString(),
        habit.category || '',
        habit.archived ? 'TRUE' : 'FALSE',
        habit.isDeleted ? 'TRUE' : 'FALSE',
        habit.createdAt || new Date().toISOString()
      ]];

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Habits:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to add habit:', errorText);
        throw new Error(`Failed to add habit: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding habit:', error);
      throw error;
    }
  }

  async updateHabit(id: string, userId: string, updates: Partial<Habit>) {
    if (!this.isAuthenticated() || !this.spreadsheetId) {
      throw new Error('Not authenticated or spreadsheet not configured');
    }

    try {
      // First, get all habits to find the row
      const habits = await this.getHabits(userId);
      const habitIndex = habits.findIndex(habit => habit.id === id);
      
      if (habitIndex === -1) {
        throw new Error('Habit not found');
      }

      const existingHabit = habits[habitIndex];
      const updatedHabit = { ...existingHabit, ...updates };

      // Prepare the row data
      const values = [[
        updatedHabit.id,
        userId,
        updatedHabit.name,
        updatedHabit.description || '',
        updatedHabit.completed ? 'TRUE' : 'FALSE',
        updatedHabit.streak.toString(),
        updatedHabit.category || '',
        updatedHabit.archived ? 'TRUE' : 'FALSE',
        updatedHabit.isDeleted ? 'TRUE' : 'FALSE',
        updatedHabit.createdAt || new Date().toISOString()
      ]];

      // Update the specific row (add 2 to account for header row and 0-based indexing)
      const rowNumber = habitIndex + 2;
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Habits!A${rowNumber}:J${rowNumber}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update habit:', errorText);
        throw new Error(`Failed to update habit: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  }

  // Tasks methods
  async getTasks(userId: string): Promise<Task[]> {
    if (!this.isAuthenticated() || !this.spreadsheetId) {
      return [];
    }

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Tasks`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch tasks:', response.status);
        return [];
      }

      const data = await response.json();
      const rows = data.values || [];

      // Skip header row and filter by userId
      return rows.slice(1)
        .filter((row: string[]) => row[1] === userId) // Filter by userId
        .map((row: string[]) => ({
          id: row[0] || '',
          title: row[2] || '',
          description: row[3] || '',
          priority: row[4] as 'Low' | 'Medium' | 'High',
          completed: row[5] === 'TRUE',
          estimatedTime: row[6] || '',
          createdDate: row[7] ? new Date(row[7]) : new Date(),
          dueDate: row[8] ? new Date(row[8]) : new Date(),
          originalDueDate: row[9] ? new Date(row[9]) : undefined,
          completedDate: row[10] ? new Date(row[10]) : undefined,
          isMoved: row[11] === 'TRUE',
          isDeleted: row[12] === 'TRUE',
          deletedDate: row[13] ? new Date(row[13]) : undefined,
          weeklyOutputId: row[14] || undefined,
        }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  async addTask(task: Task & { userId: string }) {
    if (!this.isAuthenticated() || !this.spreadsheetId) {
      throw new Error('Not authenticated or spreadsheet not configured');
    }

    try {
      const values = [[
        task.id,
        task.userId,
        task.title,
        task.description || '',
        task.priority,
        task.completed ? 'TRUE' : 'FALSE',
        task.estimatedTime || '',
        task.createdDate.toISOString(),
        task.dueDate.toISOString(),
        task.originalDueDate ? task.originalDueDate.toISOString() : '',
        task.completedDate ? task.completedDate.toISOString() : '',
        task.isMoved ? 'TRUE' : 'FALSE',
        task.isDeleted ? 'TRUE' : 'FALSE',
        task.deletedDate ? task.deletedDate.toISOString() : '',
        task.weeklyOutputId || ''
      ]];

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Tasks:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to add task:', errorText);
        throw new Error(`Failed to add task: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }

  async updateTask(id: string, userId: string, updates: Partial<Task>) {
    if (!this.isAuthenticated() || !this.spreadsheetId) {
      throw new Error('Not authenticated or spreadsheet not configured');
    }

    try {
      // First, get all tasks to find the row
      const tasks = await this.getTasks(userId);
      const taskIndex = tasks.findIndex(task => task.id === id);

      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      const existingTask = tasks[taskIndex];
      const updatedTask = { ...existingTask, ...updates };

      // Prepare the row data
      const values = [[
        updatedTask.id,
        userId,
        updatedTask.title,
        updatedTask.description || '',
        updatedTask.priority,
        updatedTask.completed ? 'TRUE' : 'FALSE',
        updatedTask.estimatedTime || '',
        updatedTask.createdDate.toISOString(),
        updatedTask.dueDate.toISOString(),
        updatedTask.originalDueDate ? updatedTask.originalDueDate.toISOString() : '',
        updatedTask.completedDate ? updatedTask.completedDate.toISOString() : '',
        updatedTask.isMoved ? 'TRUE' : 'FALSE',
        updatedTask.isDeleted ? 'TRUE' : 'FALSE',
        updatedTask.deletedDate ? updatedTask.deletedDate.toISOString() : '',
        updatedTask.weeklyOutputId || ''
      ]];

      // Update the specific row (add 2 to account for header row and 0-based indexing)
      const rowNumber = taskIndex + 2;
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Tasks!A${rowNumber}:O${rowNumber}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update task:', errorText);
        throw new Error(`Failed to update task: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  // Weekly Outputs methods
  async addWeeklyOutput(output: WeeklyOutput & { userId: string }) {
    if (!this.isAuthenticated() || !this.spreadsheetId) {
      throw new Error('Not authenticated or spreadsheet not configured');
    }

    console.log('Adding weekly output to Google Sheets:', output);

    try {
      const values = [[
        output.id,
        output.userId,
        output.title,
        output.progress.toString(),
        output.createdDate.toISOString(),
        output.dueDate ? output.dueDate.toISOString() : '',
        output.originalDueDate ? output.originalDueDate.toISOString() : '',
        output.completedDate ? output.completedDate.toISOString() : '',
        output.isMoved ? 'TRUE' : 'FALSE',
        output.isDeleted ? 'TRUE' : 'FALSE',
        output.deletedDate ? output.deletedDate.toISOString() : ''
      ]];

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/WeeklyOutputs:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to add weekly output:', errorText);
        throw new Error(`Failed to add weekly output: ${response.status} ${errorText}`);
      }

      console.log('Weekly output added successfully');
      return await response.json();
    } catch (error) {
      console.error('Error adding weekly output:', error);
      throw error;
    }
  }

  async updateWeeklyOutput(id: string, userId: string, updates: Partial<WeeklyOutput>) {
    if (!this.isAuthenticated() || !this.spreadsheetId) {
      throw new Error('Not authenticated or spreadsheet not configured');
    }

    console.log('Updating weekly output in Google Sheets:', { id, userId, updates });

    try {
      // First, get all weekly outputs to find the row
      const outputs = await this.getWeeklyOutputs(userId);
      const outputIndex = outputs.findIndex(output => output.id === id);
      
      if (outputIndex === -1) {
        throw new Error('Weekly output not found');
      }

      const existingOutput = outputs[outputIndex];
      const updatedOutput = { ...existingOutput, ...updates };

      // Prepare the row data
      const values = [[
        updatedOutput.id,
        userId,
        updatedOutput.title,
        updatedOutput.progress.toString(),
        updatedOutput.createdDate.toISOString(),
        updatedOutput.dueDate ? updatedOutput.dueDate.toISOString() : '',
        updatedOutput.originalDueDate ? updatedOutput.originalDueDate.toISOString() : '',
        updatedOutput.completedDate ? updatedOutput.completedDate.toISOString() : '',
        updatedOutput.isMoved ? 'TRUE' : 'FALSE',
        updatedOutput.isDeleted ? 'TRUE' : 'FALSE',
        updatedOutput.deletedDate ? updatedOutput.deletedDate.toISOString() : ''
      ]];

      // Update the specific row (add 2 to account for header row and 0-based indexing)
      const rowNumber = outputIndex + 2;
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/WeeklyOutputs!A${rowNumber}:K${rowNumber}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update weekly output:', errorText);
        throw new Error(`Failed to update weekly output: ${response.status} ${errorText}`);
      }

      console.log('Weekly output updated successfully');
      return await response.json();
    } catch (error) {
      console.error('Error updating weekly output:', error);
      throw error;
    }
  }

  async getWeeklyOutputs(userId: string): Promise<WeeklyOutput[]> {
    if (!this.isAuthenticated() || !this.spreadsheetId) {
      return [];
    }

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/WeeklyOutputs`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch weekly outputs:', response.status);
        return [];
      }

      const data = await response.json();
      const rows = data.values || [];
      
      // Skip header row and filter by userId
      return rows.slice(1)
        .filter((row: string[]) => row[1] === userId) // Filter by userId
        .map((row: string[]) => ({
          id: row[0] || '',
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

  // Mood Tracking methods
  async getMoodData(userId: string): Promise<MoodEntry[]> {
    if (!this.isAuthenticated() || !this.spreadsheetId) {
      return [];
    }

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/MoodTracking`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch mood data:', response.status);
        return [];
      }

      const data = await response.json();
      const rows = data.values || [];

      // Skip header row and filter by userId
      return rows.slice(1)
        .filter((row: string[]) => row[1] === userId) // Filter by userId
        .map((row: string[]) => ({
          id: row[0] || '',
          userId: row[1] || '',
          date: row[2] || '',
          mood: parseInt(row[3]) || 0,
          notes: row[4] || '',
        }));
    } catch (error) {
      console.error('Error fetching mood data:', error);
      return [];
    }
  }

  async addMoodEntry(moodEntry: MoodEntry) {
    if (!this.isAuthenticated() || !this.spreadsheetId) {
      throw new Error('Not authenticated or spreadsheet not configured');
    }

    try {
      const values = [[
        moodEntry.id,
        moodEntry.userId,
        moodEntry.date,
        moodEntry.mood.toString(),
        moodEntry.notes || '',
      ]];

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/MoodTracking:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to add mood entry:', errorText);
        throw new Error(`Failed to add mood entry: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding mood entry:', error);
      throw error;
    }
  }

  async updateMoodEntry(id: string, userId: string, updates: Partial<MoodEntry>) {
    if (!this.isAuthenticated() || !this.spreadsheetId) {
      throw new Error('Not authenticated or spreadsheet not configured');
    }

    try {
      // First, get all mood entries to find the row
      const moodEntries = await this.getMoodData(userId);
      const moodEntryIndex = moodEntries.findIndex(entry => entry.id === id);

      if (moodEntryIndex === -1) {
        throw new Error('Mood entry not found');
      }

      const existingEntry = moodEntries[moodEntryIndex];
      const updatedEntry = { ...existingEntry, ...updates };

      // Prepare the row data
      const values = [[
        updatedEntry.id,
        updatedEntry.userId,
        updatedEntry.date,
        updatedEntry.mood.toString(),
        updatedEntry.notes || '',
      ]];

      // Update the specific row (add 2 to account for header row and 0-based indexing)
      const rowNumber = moodEntryIndex + 2;
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/MoodTracking!A${rowNumber}:E${rowNumber}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update mood entry:', errorText);
        throw new Error(`Failed to update mood entry: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating mood entry:', error);
      throw error;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
