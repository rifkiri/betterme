
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
  showOnlyOngoing?: boolean;
  statusFilter?: 'all' | 'ongoing' | 'completed';
  yearFilter?: string;
}

export const IndividualPerformanceContent = ({
  employee,
  showOnlyOngoing = false,
  statusFilter = 'all',
  yearFilter = 'all',
}: IndividualPerformanceContentProps) => {
  const filteredTasks = React.useMemo(() => {
    const source = employee.allTasks || employee.recentTasks || [];
    return source.filter(task => {
      if (showOnlyOngoing && task.completed) return false;
      if (statusFilter === 'ongoing' && task.completed) return false;
      if (statusFilter === 'completed' && !task.completed) return false;
      if (yearFilter !== 'all' && task.dueDate) {
        const y = new Date(task.dueDate).getFullYear().toString();
        if (y !== yearFilter) return false;
      }
      return true;
    });
  }, [employee.allTasks, employee.recentTasks, showOnlyOngoing, statusFilter, yearFilter]);

  const filteredOutputs = React.useMemo(() => {
    return (employee.weeklyOutputs || []).filter(output => {
      if (showOnlyOngoing && output.progress === 100) return false;
      if (statusFilter === 'ongoing' && output.progress === 100) return false;
      if (statusFilter === 'completed' && output.progress < 100) return false;
      if (yearFilter !== 'all' && output.dueDate) {
        const y = new Date(output.dueDate).getFullYear().toString();
        if (y !== yearFilter) return false;
      }
      return true;
    });
  }, [employee.weeklyOutputs, showOnlyOngoing, statusFilter, yearFilter]);

  const filteredHabits = React.useMemo(() => {
    return (employee.habits || []).filter(habit => {
      if (showOnlyOngoing && habit.completed) return false;
      if (statusFilter === 'ongoing' && habit.completed) return false;
      if (statusFilter === 'completed' && !habit.completed) return false;
      return true;
    });
  }, [employee.habits, showOnlyOngoing, statusFilter]);

  return (
    <>
      <EmployeeOverview employee={employee} />

      <IndividualMoodChart
        employeeName={employee.name}
        moodData={employee.moodData || []}
      />

      <OverdueSection
        overdueTasks={employee.overdueTasks}
        overdueOutputs={employee.overdueOutputs}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HabitsPerformance habits={filteredHabits} />
        <RecentTasksCard tasks={filteredTasks} />
      </div>

      <WeeklyOutputsProgress outputs={filteredOutputs} />
    </>
  );
};
