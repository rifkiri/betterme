
import { useState, useEffect } from 'react';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { EmployeeData } from '@/types/individualData';
import { transformUserToEmployeeData } from '@/utils/employeeDataTransformer';

export const useEmployeeData = () => {
  const [employeeData, setEmployeeData] = useState<Record<string, EmployeeData>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEmployeeData = async () => {
      setIsLoading(true);
      try {
        console.log('Loading users for employee data...');
        const users = await supabaseDataService.getUsers();
        
        // Include both team members and managers, exclude only admins
        const teamMembers = users.filter(user => user.role !== 'admin');
        console.log('Team members for employee data (excluding admins):', teamMembers);
        
        const employeeDataMap: Record<string, EmployeeData> = {};
        
        for (const user of teamMembers) {
          try {
            console.log(`Transforming data for user: ${user.name} (${user.role})`);
            const employeeData = await transformUserToEmployeeData(user);
            employeeDataMap[user.id] = employeeData;
            console.log(`Successfully transformed data for ${user.name}`);
          } catch (error) {
            console.error(`Failed to transform data for user ${user.id}:`, error);
          }
        }
        
        console.log('Final employee data map:', employeeDataMap);
        setEmployeeData(employeeDataMap);
      } catch (error) {
        console.error('Failed to load employee data:', error);
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
