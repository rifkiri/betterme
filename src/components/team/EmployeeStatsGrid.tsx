
import React from 'react';
import { Target, CheckCircle, Clock, Award } from 'lucide-react';
import { QuickStatsCard } from '../QuickStatsCard';
import { EmployeeData } from '@/types/individualData';

interface EmployeeStatsGridProps {
  employee: EmployeeData;
}

export const EmployeeStatsGrid = ({ employee }: EmployeeStatsGridProps) => {
  const completedHabits = employee.habits.filter(habit => habit.completed).length;
  const todaysTasksCompleted = employee.recentTasks.filter(t => t.completed).length;
  const overdueCount = employee.overdueTasks.length + employee.overdueOutputs.length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-2 lg:gap-4 mb-2 sm:mb-4 px-1 sm:px-2">
      <QuickStatsCard 
        title="Habits Today" 
        value={`${completedHabits}/${employee.habits.length}`} 
        icon={Target} 
        gradient="bg-gradient-to-r from-blue-50 to-blue-100" 
      />
      <QuickStatsCard 
        title="Best Streak" 
        value={employee.stats.bestStreak.toString()} 
        icon={Award} 
        gradient="bg-gradient-to-r from-purple-50 to-purple-100" 
      />
      <QuickStatsCard 
        title="Today's Tasks" 
        value={`${todaysTasksCompleted}/${employee.recentTasks.length}`} 
        icon={CheckCircle} 
        gradient="bg-gradient-to-r from-green-50 to-green-100" 
      />
      <QuickStatsCard 
        title="Overdue" 
        value={overdueCount.toString()} 
        icon={Clock} 
        gradient="bg-gradient-to-r from-orange-50 to-orange-100" 
      />
    </div>
  );
};
