
import { useState, useEffect } from 'react';
import { EmployeeData } from '@/types/individualData';
import { EmployeeDataService } from '@/services/EmployeeDataService';
import { toast } from 'sonner';

export const useEmployeeData = () => {
  const [employeeData, setEmployeeData] = useState<Record<string, EmployeeData>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEmployeeData = async () => {
      setIsLoading(true);
      try {
        const data = await EmployeeDataService.loadAllEmployeeData();
        setEmployeeData(data);
        console.log('Employee data loaded from Google Sheets:', data);
      } catch (error) {
        console.error('Failed to load employee data from Google Sheets:', error);
        
        if (error instanceof Error) {
          if (error.message === 'Google Sheets not configured') {
            toast.error('Google Sheets not configured. Please configure in Settings.');
          } else if (error.message === 'Google Sheets not authenticated') {
            toast.error('Google Sheets not authenticated. Please authenticate in Settings.');
          } else {
            toast.error('Failed to load data from Google Sheets. Please check your configuration.');
          }
        } else {
          toast.error('Failed to load data from Google Sheets. Please check your configuration.');
        }
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
