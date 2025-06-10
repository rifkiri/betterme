
import React from 'react';
import { EmployeeData } from '@/types/individualData';

interface EmployeeDashboardHeaderProps {
  employee: EmployeeData;
  onBack: () => void;
}

export const EmployeeDashboardHeader = ({ employee, onBack }: EmployeeDashboardHeaderProps) => {
  return (
    <div className="text-center mb-2 sm:mb-4 px-2">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          ← Back to Team Overview
        </button>
        <div className="text-right">
          <div className="text-xs text-gray-500">Viewing as Manager</div>
          <div className="text-sm font-medium text-gray-700">{employee.name}'s Dashboard</div>
        </div>
      </div>
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
        {employee.name}'s Productivity
      </h1>
      <p className="text-gray-600 text-xs sm:text-sm lg:text-base">
        {employee.role} - Track habits, manage tasks, and plan the week
      </p>
    </div>
  );
};
