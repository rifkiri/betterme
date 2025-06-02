
import { supabaseDataService } from '@/services/SupabaseDataService';
import { EmployeeData } from '@/types/individualData';
import { transformToEmployeeData } from '@/utils/employeeDataTransformer';

export class EmployeeDataService {
  static async loadAllEmployeeData(): Promise<Record<string, EmployeeData>> {
    // Get all team members from Supabase
    const users = await supabaseDataService.getUsers();
    const teamMembers = users.filter(user => user.role === 'team-member');
    
    const data: Record<string, EmployeeData> = {};
    
    // Load data for each team member from Supabase
    for (const member of teamMembers) {
      const [habits, tasks, outputs] = await Promise.all([
        supabaseDataService.getHabits(member.id),
        supabaseDataService.getTasks(member.id),
        supabaseDataService.getWeeklyOutputs(member.id)
      ]);
      
      data[member.id] = transformToEmployeeData(member, habits, tasks, outputs);
    }
    
    return data;
  }
}
