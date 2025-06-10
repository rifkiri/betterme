
import React, { useState, useEffect } from 'react';
import { EmployeeSelector } from './individual/EmployeeSelector';
import { IndividualPerformanceStates } from './individual/IndividualPerformanceStates';
import { IndividualPerformanceContent } from './individual/IndividualPerformanceContent';
import { useEmployeeData } from '@/hooks/useEmployeeData';

interface IndividualPerformanceProps {
  preSelectedEmployee?: string;
  onEmployeeChange?: (employeeId: string) => void;
}

export const IndividualPerformance = ({ 
  preSelectedEmployee, 
  onEmployeeChange 
}: IndividualPerformanceProps) => {
  const [selectedEmployee, setSelectedEmployee] = useState(preSelectedEmployee || '');
  const { employeeData, isLoading } = useEmployeeData();

  // Handle pre-selected employee
  useEffect(() => {
    if (preSelectedEmployee && Object.keys(employeeData).length > 0) {
      setSelectedEmployee(preSelectedEmployee);
    }
  }, [preSelectedEmployee, employeeData]);

  // Auto-select first employee if none selected and there are team members
  useEffect(() => {
    if (!selectedEmployee && Object.keys(employeeData).length > 0) {
      const firstEmployeeId = Object.keys(employeeData)[0];
      setSelectedEmployee(firstEmployeeId);
    }
  }, [selectedEmployee, employeeData]);

  // Handle employee change
  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    onEmployeeChange?.(employeeId);
  };

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
      onEmployeeChange={handleEmployeeChange}
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
        onEmployeeChange={handleEmployeeChange} 
      />

      <IndividualPerformanceContent employee={employee} />
    </div>
  );
};
