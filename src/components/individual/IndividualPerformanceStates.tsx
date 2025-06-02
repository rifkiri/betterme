
import React from 'react';
import { EmployeeSelector } from './EmployeeSelector';
import { googleSheetsService } from '@/services/GoogleSheetsService';

interface IndividualPerformanceStatesProps {
  selectedEmployee: string;
  onEmployeeChange: (value: string) => void;
  isLoading: boolean;
  hasEmployeeData: boolean;
}

export const IndividualPerformanceStates = ({
  selectedEmployee,
  onEmployeeChange,
  isLoading,
  hasEmployeeData
}: IndividualPerformanceStatesProps) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading employee data from Google Sheets...</p>
      </div>
    );
  }

  if (!googleSheetsService.isConfigured() || !googleSheetsService.isAuthenticated()) {
    return (
      <div className="space-y-6">
        <EmployeeSelector 
          selectedEmployee={selectedEmployee} 
          onEmployeeChange={onEmployeeChange} 
        />
        <div className="text-center py-8">
          <p className="text-gray-500">Google Sheets not configured or authenticated. Please configure in Settings.</p>
        </div>
      </div>
    );
  }

  if (!hasEmployeeData) {
    return (
      <div className="space-y-6">
        <EmployeeSelector 
          selectedEmployee={selectedEmployee} 
          onEmployeeChange={onEmployeeChange} 
        />
        <div className="text-center py-8">
          <p className="text-gray-500">No team members available in Google Sheets. Please add team members to view individual performance.</p>
        </div>
      </div>
    );
  }

  return null;
};
