
import { googleSheetsService } from '@/services/GoogleSheetsService';
import { EmployeeData } from '@/types/individualData';
import { transformToEmployeeData } from '@/utils/employeeDataTransformer';

export class EmployeeDataService {
  static async loadAllEmployeeData(): Promise<Record<string, EmployeeData>> {
    // Check if Google Sheets is configured and authenticated
    if (!googleSheetsService.isConfigured()) {
      throw new Error('Google Sheets not configured');
    }

    if (!googleSheetsService.isAuthenticated()) {
      throw new Error('Google Sheets not authenticated');
    }

    // Get all team members from Google Sheets
    const users = await googleSheetsService.getUsers();
    const teamMembers = users.filter(user => user.role === 'team-member');
    
    const data: Record<string, EmployeeData> = {};
    
    // Load data for each team member from Google Sheets
    for (const member of teamMembers) {
      const [habits, tasks, outputs] = await Promise.all([
        googleSheetsService.getHabits(member.id),
        googleSheetsService.getTasks(member.id),
        googleSheetsService.getWeeklyOutputs(member.id)
      ]);
      
      data[member.id] = transformToEmployeeData(member, habits, tasks, outputs);
    }
    
    return data;
  }
}
