import { BaseGoogleSheetsService } from './BaseGoogleSheetsService';
import { Task } from '@/types/productivity';

class GoogleTasksService extends BaseGoogleSheetsService {
  async getTasks(userId: string): Promise<Task[]> {
    if (!this.isAuthenticated()) {
      return [];
    }

    try {
      const spreadsheetId = this.getSpreadsheetId();
      const data = await this.makeRequest(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tasks`
      );

      const rows = data.values || [];
      return rows.slice(1)
        .filter((row: string[]) => row[1] === userId)
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
    const spreadsheetId = this.getSpreadsheetId();
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

    return await this.makeRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tasks:append?valueInputOption=RAW`,
      {
        method: 'POST',
        body: JSON.stringify({ values }),
      }
    );
  }

  async updateTask(id: string, userId: string, updates: Partial<Task>) {
    const tasks = await this.getTasks(userId);
    const taskIndex = tasks.findIndex(task => task.id === id);

    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    const existingTask = tasks[taskIndex];
    const updatedTask = { ...existingTask, ...updates };
    const spreadsheetId = this.getSpreadsheetId();

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

    const rowNumber = taskIndex + 2;
    return await this.makeRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tasks!A${rowNumber}:O${rowNumber}?valueInputOption=RAW`,
      {
        method: 'PUT',
        body: JSON.stringify({ values }),
      }
    );
  }
}

export const googleTasksService = new GoogleTasksService();
