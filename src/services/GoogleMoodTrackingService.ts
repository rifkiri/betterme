import { BaseGoogleSheetsService } from './BaseGoogleSheetsService';

interface MoodEntry {
  id: string;
  userId: string;
  date: string;
  mood: number;
  notes?: string;
}

class GoogleMoodTrackingService extends BaseGoogleSheetsService {
  async getMoodData(userId: string): Promise<MoodEntry[]> {
    if (!this.isAuthenticated()) {
      return [];
    }

    try {
      const spreadsheetId = this.getSpreadsheetId();
      const data = await this.makeRequest(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/MoodTracking`
      );

      const rows = data.values || [];
      return rows.slice(1)
        .filter((row: string[]) => row[1] === userId)
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
    const spreadsheetId = this.getSpreadsheetId();
    const values = [[
      moodEntry.id,
      moodEntry.userId,
      moodEntry.date,
      moodEntry.mood.toString(),
      moodEntry.notes || '',
    ]];

    return await this.makeRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/MoodTracking:append?valueInputOption=RAW`,
      {
        method: 'POST',
        body: JSON.stringify({ values }),
      }
    );
  }

  async updateMoodEntry(id: string, userId: string, updates: Partial<MoodEntry>) {
    const moodEntries = await this.getMoodData(userId);
    const moodEntryIndex = moodEntries.findIndex(entry => entry.id === id);

    if (moodEntryIndex === -1) {
      throw new Error('Mood entry not found');
    }

    const existingEntry = moodEntries[moodEntryIndex];
    const updatedEntry = { ...existingEntry, ...updates };
    const spreadsheetId = this.getSpreadsheetId();

    const values = [[
      updatedEntry.id,
      updatedEntry.userId,
      updatedEntry.date,
      updatedEntry.mood.toString(),
      updatedEntry.notes || '',
    ]];

    const rowNumber = moodEntryIndex + 2;
    return await this.makeRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/MoodTracking!A${rowNumber}:E${rowNumber}?valueInputOption=RAW`,
      {
        method: 'PUT',
        body: JSON.stringify({ values }),
      }
    );
  }
}

export const googleMoodTrackingService = new GoogleMoodTrackingService();
