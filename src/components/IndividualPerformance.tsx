
import React, { useState } from 'react';
import { EmployeeSelector } from './individual/EmployeeSelector';
import { EmployeeOverview } from './individual/EmployeeOverview';
import { OverdueSection } from './individual/OverdueSection';
import { HabitsPerformance } from './individual/HabitsPerformance';
import { RecentTasksCard } from './individual/RecentTasksCard';
import { WeeklyOutputsProgress } from './individual/WeeklyOutputsProgress';
import { IndividualMoodChart } from './individual/IndividualMoodChart';
import { EmployeeData } from '@/types/individualData';

// Empty employee data - will be populated from real data sources
const employeeData: Record<string, EmployeeData> = {};

export const IndividualPerformance = () => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const employee = employeeData[selectedEmployee];

  if (!employee) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No employee data available. Please connect to your data source.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EmployeeSelector 
        selectedEmployee={selectedEmployee} 
        onEmployeeChange={setSelectedEmployee} 
      />

      <EmployeeOverview employee={employee} />

      <IndividualMoodChart employeeName={employee.name} />

      <OverdueSection 
        overdueTasks={employee.overdueTasks} 
        overdueOutputs={employee.overdueOutputs} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HabitsPerformance habits={employee.habits} />
        <RecentTasksCard tasks={employee.recentTasks} />
      </div>

      <WeeklyOutputsProgress outputs={employee.weeklyOutputs} />
    </div>
  );
};
