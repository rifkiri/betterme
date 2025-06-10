
import React, { useState } from 'react';
import { DateNavigator } from '../DateNavigator';
import { EmployeeData } from '@/types/individualData';
import { EmployeeDashboardHeader } from './EmployeeDashboardHeader';
import { EmployeeStatsGrid } from './EmployeeStatsGrid';
import { EmployeeDashboardLayout } from './EmployeeDashboardLayout';
import { transformEmployeeDataForDashboard, createMockHandlers } from '@/utils/employeeDashboardTransformer';

interface FullEmployeeDashboardViewProps {
  employee: EmployeeData;
  onBack: () => void;
}

export const FullEmployeeDashboardView = ({ employee, onBack }: FullEmployeeDashboardViewProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Transform employee data and create mock handlers
  const {
    transformedHabits,
    transformedTasks,
    transformedOverdueTasks,
    transformedWeeklyOutputs,
    transformedOverdueOutputs
  } = transformEmployeeDataForDashboard(employee);

  const mockHandlers = {
    ...createMockHandlers(),
    handleDateChange: setSelectedDate, // This now properly updates the state
  };

  // Helper function to get tasks by date for TasksSection
  const getTasksByDate = (date: Date) => {
    return transformedTasks.filter(task => 
      task.dueDate.toDateString() === date.toDateString()
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-1 sm:p-2 lg:p-4">
      <div className="max-w-full mx-auto space-y-2 sm:space-y-4">
        <EmployeeDashboardHeader employee={employee} onBack={onBack} />

        {/* Date Navigation */}
        <div className="flex justify-center mb-4">
          <DateNavigator 
            selectedDate={selectedDate} 
            onDateChange={setSelectedDate}
          />
        </div>

        <EmployeeStatsGrid employee={employee} />

        <EmployeeDashboardLayout
          transformedHabits={transformedHabits}
          transformedTasks={transformedTasks}
          transformedOverdueTasks={transformedOverdueTasks}
          transformedWeeklyOutputs={transformedWeeklyOutputs}
          transformedOverdueOutputs={transformedOverdueOutputs}
          selectedDate={selectedDate}
          mockHandlers={mockHandlers}
          getTasksByDate={getTasksByDate}
        />
      </div>
    </div>
  );
};
