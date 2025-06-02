
import { BaseGoogleSheetsService } from './BaseGoogleSheetsService';
import { WeeklyOutput } from '@/types/productivity';

class GoogleWeeklyOutputsService extends BaseGoogleSheetsService {
  async getWeeklyOutputs(userId: string): Promise<WeeklyOutput[]> {
    if (!this.isAuthenticated() || !this.spreadsheetId) {
      return [];
    }

    try {
      const data = await this.makeRequest(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/WeeklyOutputs`
      );

      const rows = data.values || [];
      return rows.slice(1)
        .filter((row: string[]) => row[1] === userId)
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

  async addWeeklyOutput(output: WeeklyOutput & { userId: string }) {
    console.log('Adding weekly output to Google Sheets:', output);

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

    const result = await this.makeRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/WeeklyOutputs:append?valueInputOption=RAW`,
      {
        method: 'POST',
        body: JSON.stringify({ values }),
      }
    );

    console.log('Weekly output added successfully');
    return result;
  }

  async updateWeeklyOutput(id: string, userId: string, updates: Partial<WeeklyOutput>) {
    console.log('Updating weekly output in Google Sheets:', { id, userId, updates });

    const outputs = await this.getWeeklyOutputs(userId);
    const outputIndex = outputs.findIndex(output => output.id === id);
    
    if (outputIndex === -1) {
      throw new Error('Weekly output not found');
    }

    const existingOutput = outputs[outputIndex];
    const updatedOutput = { ...existingOutput, ...updates };

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

    const rowNumber = outputIndex + 2;
    const result = await this.makeRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/WeeklyOutputs!A${rowNumber}:K${rowNumber}?valueInputOption=RAW`,
      {
        method: 'PUT',
        body: JSON.stringify({ values }),
      }
    );

    console.log('Weekly output updated successfully');
    return result;
  }
}

export const googleWeeklyOutputsService = new GoogleWeeklyOutputsService();
