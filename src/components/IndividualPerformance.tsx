
import React, { useState, useEffect } from 'react';
import { EmployeeSelector } from './individual/EmployeeSelector';
import { IndividualPerformanceStates } from './individual/IndividualPerformanceStates';
import { IndividualPerformanceContent } from './individual/IndividualPerformanceContent';
import { useEmployeeData } from '@/hooks/useEmployeeData';

export const IndividualPerformance = () => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const { employeeData, isLoading } = useEmployeeData();

  // Auto-select first employee if none selected and there are team members
  useEffect(() => {
    if (!selectedEmployee && Object.keys(employeeData).length > 0) {
      const firstEmployeeId = Object.keys(employeeData)[0];
      setSelectedEmployee(firstEmployeeId);
    }
  }, [selectedEmployee, employeeData]);

  // Update selected employee when it changes
  useEffect(() => {
    console.log('Selected employee changed to:', selectedEmployee);
  }, [selectedEmployee]);

  const employee = selectedEmployee ? employeeData[selectedEmployee] : null;
  const hasEmployeeData = Object.keys(employeeData).length > 0;

  // Show states component for loading, errors, or empty states
  const statesComponent = (
    <IndividualPerformanceStates
      selectedEmployee={selectedEmployee}
      onEmployeeChange={setSelectedEmployee}
      isLoading={isLoading}
      hasEmployeeData={hasEmployeeData}
    />
  );

  if (isLoading || !hasEmployeeData || !employee) {
    return statesComponent;
  }

  return (
    <div className="space-y-6">
      <EmployeeSelector 
        selectedEmployee={selectedEmployee} 
        onEmployeeChange={setSelectedEmployee} 
      />

      <IndividualPerformanceContent employee={employee} />
    </div>
  );
};
