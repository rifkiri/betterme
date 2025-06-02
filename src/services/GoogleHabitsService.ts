
import { BaseGoogleSheetsService } from './BaseGoogleSheetsService';
import { Habit } from '@/types/productivity';

class GoogleHabitsService extends BaseGoogleSheetsService {
  async getHabits(userId: string): Promise<Habit[]> {
    if (!this.isAuthenticated() || !this.spreadsheetId) {
      return [];
    }

    try {
      const data = await this.makeRequest(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Habits`
      );

      const rows = data.values || [];
      return rows.slice(1)
        .filter((row: string[]) => row[1] === userId)
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

    return await this.makeRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Habits:append?valueInputOption=RAW`,
      {
        method: 'POST',
        body: JSON.stringify({ values }),
      }
    );
  }

  async updateHabit(id: string, userId: string, updates: Partial<Habit>) {
    const habits = await this.getHabits(userId);
    const habitIndex = habits.findIndex(habit => habit.id === id);
    
    if (habitIndex === -1) {
      throw new Error('Habit not found');
    }

    const existingHabit = habits[habitIndex];
    const updatedHabit = { ...existingHabit, ...updates };

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

    const rowNumber = habitIndex + 2;
    return await this.makeRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Habits!A${rowNumber}:J${rowNumber}?valueInputOption=RAW`,
      {
        method: 'PUT',
        body: JSON.stringify({ values }),
      }
    );
  }
}

export const googleHabitsService = new GoogleHabitsService();
