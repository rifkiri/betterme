
import React from 'react';
import { EmployeeOverview } from './EmployeeOverview';
import { OverdueSection } from './OverdueSection';
import { HabitsPerformance } from './HabitsPerformance';
import { RecentTasksCard } from './RecentTasksCard';
import { WeeklyOutputsProgress } from './WeeklyOutputsProgress';
import { IndividualMoodChart } from './IndividualMoodChart';
import { EmployeeData } from '@/types/individualData';

interface IndividualPerformanceContentProps {
  employee: EmployeeData;
}

export const IndividualPerformanceContent = ({ employee }: IndividualPerformanceContentProps) => {
  return (
    <>
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
    </>
  );
};
