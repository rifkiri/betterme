
import React from 'react';
import { EmployeeSelector } from './EmployeeSelector';

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
        <p className="text-gray-500">Loading employee data from Supabase...</p>
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
          <p className="text-gray-500">No team members available. Please add team members with 'team-member' role to view individual performance.</p>
        </div>
      </div>
    );
  }

  return null;
};
