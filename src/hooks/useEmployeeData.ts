
import { useState, useEffect } from 'react';
import { EmployeeData } from '@/types/individualData';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { transformToEmployeeData } from '@/utils/employeeDataTransformer';
import { toast } from 'sonner';

export const useEmployeeData = () => {
  const [employeeData, setEmployeeData] = useState<Record<string, EmployeeData>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEmployeeData = async () => {
      setIsLoading(true);
      try {
        // Get all team members from Supabase
        const users = await supabaseDataService.getUsers();
        const teamMembers = users.filter(user => user.role === 'team-member');
        
        console.log('Team members from Supabase:', teamMembers);
        
        const data: Record<string, EmployeeData> = {};
        
        // Load data for each team member from Supabase
        for (const member of teamMembers) {
          const [habits, tasks, outputs, moodData] = await Promise.all([
            supabaseDataService.getHabits(member.id),
            supabaseDataService.getTasks(member.id),
            supabaseDataService.getWeeklyOutputs(member.id),
            supabaseDataService.getMoodData(member.id)
          ]);
          
          data[member.id] = transformToEmployeeData(member, habits, tasks, outputs, moodData);
        }
        
        setEmployeeData(data);
        console.log('Employee data loaded from Supabase:', data);
      } catch (error) {
        console.error('Failed to load employee data from Supabase:', error);
        toast.error('Failed to load employee data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployeeData();
  }, []);

  return {
    employeeData,
    isLoading
  };
};
