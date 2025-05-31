
import React, { useState } from 'react';
import { EmployeeSelector } from './individual/EmployeeSelector';
import { EmployeeOverview } from './individual/EmployeeOverview';
import { OverdueSection } from './individual/OverdueSection';
import { HabitsPerformance } from './individual/HabitsPerformance';
import { RecentTasksCard } from './individual/RecentTasksCard';
import { WeeklyOutputsProgress } from './individual/WeeklyOutputsProgress';
import { EmployeeData } from '@/types/individualData';

// Mock individual data
const employeeData: Record<string, EmployeeData> = {
  'sarah-johnson': {
    name: 'Sarah Johnson',
    role: 'Senior Developer',
    avatar: 'SJ',
    stats: {
      habitsCompletionRate: 90,
      tasksCompletionRate: 95,
      outputsCompletionRate: 88,
      bestStreak: 21,
      currentStreak: 14
    },
    habits: [
      { name: 'Morning Exercise', completed: true, streak: 14 },
      { name: 'Code Review', completed: true, streak: 21 },
      { name: 'Reading Tech Articles', completed: false, streak: 7 },
      { name: 'Team Standup', completed: true, streak: 18 }
    ],
    recentTasks: [
      { title: 'API Integration', priority: 'High', completed: true, dueDate: '2024-05-30' },
      { title: 'Database Optimization', priority: 'Medium', completed: true, dueDate: '2024-05-29' },
      { title: 'Code Documentation', priority: 'Low', completed: false, dueDate: '2024-05-31' }
    ],
    weeklyOutputs: [
      { title: 'User Authentication System', progress: 95, dueDate: '2024-06-02' },
      { title: 'Performance Monitoring Dashboard', progress: 70, dueDate: '2024-06-07' }
    ],
    overdueTasks: [
      { title: 'Legacy Code Refactoring', priority: 'Medium', daysOverdue: 2, originalDueDate: '2024-05-29' }
    ],
    overdueOutputs: [
      { title: 'Mobile App Integration', progress: 60, daysOverdue: 1, originalDueDate: '2024-05-30' }
    ]
  },
  'mike-chen': {
    name: 'Mike Chen',
    role: 'Product Manager',
    avatar: 'MC',
    stats: {
      habitsCompletionRate: 85,
      tasksCompletionRate: 78,
      outputsCompletionRate: 82,
      bestStreak: 15,
      currentStreak: 9
    },
    habits: [
      { name: 'Product Research', completed: true, streak: 9 },
      { name: 'Stakeholder Check-ins', completed: true, streak: 12 },
      { name: 'Market Analysis', completed: false, streak: 3 },
      { name: 'Team Planning', completed: true, streak: 15 }
    ],
    recentTasks: [
      { title: 'Feature Specification', priority: 'High', completed: false, dueDate: '2024-05-31' },
      { title: 'User Interview Analysis', priority: 'Medium', completed: true, dueDate: '2024-05-29' },
      { title: 'Roadmap Update', priority: 'High', completed: true, dueDate: '2024-05-28' }
    ],
    weeklyOutputs: [
      { title: 'Q3 Product Roadmap', progress: 85, dueDate: '2024-06-01' },
      { title: 'User Research Report', progress: 60, dueDate: '2024-06-05' }
    ],
    overdueTasks: [
      { title: 'Market Competitor Analysis', priority: 'High', daysOverdue: 3, originalDueDate: '2024-05-28' },
      { title: 'Product Metrics Review', priority: 'Medium', daysOverdue: 1, originalDueDate: '2024-05-30' }
    ],
    overdueOutputs: [
      { title: 'Q2 Marketing Campaign Strategy', progress: 40, daysOverdue: 4, originalDueDate: '2024-05-27' }
    ]
  }
};

export const IndividualPerformance = () => {
  const [selectedEmployee, setSelectedEmployee] = useState('sarah-johnson');
  const employee = employeeData[selectedEmployee];

  return (
    <div className="space-y-6">
      <EmployeeSelector 
        selectedEmployee={selectedEmployee} 
        onEmployeeChange={setSelectedEmployee} 
      />

      <EmployeeOverview employee={employee} />

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
