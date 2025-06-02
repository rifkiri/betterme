
import React, { useState, useEffect } from 'react';
import { EmployeeSelector } from './individual/EmployeeSelector';
import { EmployeeOverview } from './individual/EmployeeOverview';
import { OverdueSection } from './individual/OverdueSection';
import { HabitsPerformance } from './individual/HabitsPerformance';
import { RecentTasksCard } from './individual/RecentTasksCard';
import { WeeklyOutputsProgress } from './individual/WeeklyOutputsProgress';
import { IndividualMoodChart } from './individual/IndividualMoodChart';
import { EmployeeData } from '@/types/individualData';
import { localDataService } from '@/services/LocalDataService';

export const IndividualPerformance = () => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeeData, setEmployeeData] = useState<Record<string, EmployeeData>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEmployeeData = () => {
      setIsLoading(true);
      try {
        // Get all team members
        const users = localDataService.getUsers();
        const teamMembers = users.filter(user => user.role === 'team-member');
        
        const data: Record<string, EmployeeData> = {};
        
        teamMembers.forEach(member => {
          const habits = localDataService.getHabits(member.id);
          const tasks = localDataService.getTasks(member.id);
          const outputs = localDataService.getWeeklyOutputs(member.id);
          
          // Generate overdue items
          const today = new Date();
          const overdueTasks = tasks.filter(task => 
            !task.completed && !task.isDeleted && task.dueDate && task.dueDate < today
          ).map(task => ({
            id: task.id,
            title: task.title,
            priority: task.priority as 'High' | 'Medium' | 'Low',
            daysOverdue: Math.floor((today.getTime() - task.dueDate!.getTime()) / (1000 * 60 * 60 * 24))
          }));
          
          const overdueOutputs = outputs.filter(output => 
            output.progress < 100 && !output.isDeleted && output.dueDate && output.dueDate < today
          ).map(output => ({
            id: output.id,
            title: output.title,
            progress: output.progress,
            daysOverdue: Math.floor((today.getTime() - output.dueDate!.getTime()) / (1000 * 60 * 60 * 24))
          }));
          
          // Recent tasks (last 10)
          const recentTasks = tasks
            .filter(task => !task.isDeleted)
            .sort((a, b) => (b.createdDate?.getTime() || 0) - (a.createdDate?.getTime() || 0))
            .slice(0, 10)
            .map(task => ({
              id: task.id,
              title: task.title,
              completed: task.completed,
              dueDate: task.dueDate?.toISOString().split('T')[0] || '',
              priority: task.priority as 'High' | 'Medium' | 'Low'
            }));
          
          // Weekly outputs for current week
          const startOfWeek = new Date();
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 6);
          
          const weeklyOutputs = outputs
            .filter(output => !output.isDeleted)
            .map(output => ({
              id: output.id,
              title: output.title,
              progress: output.progress,
              dueDate: output.dueDate?.toISOString().split('T')[0] || ''
            }));
          
          data[member.id] = {
            id: member.id,
            name: member.name,
            role: member.position || 'Team Member',
            email: member.email,
            overdueTasks,
            overdueOutputs,
            habits: habits.filter(h => !h.archived).map(habit => ({
              id: habit.id,
              name: habit.name,
              completed: habit.completed,
              streak: habit.streak,
              targetDays: habit.targetDays || []
            })),
            recentTasks,
            weeklyOutputs
          };
        });
        
        setEmployeeData(data);
        
        // Auto-select first employee if none selected
        if (!selectedEmployee && teamMembers.length > 0) {
          setSelectedEmployee(teamMembers[0].id);
        }
        
        console.log('Employee data loaded:', data);
      } catch (error) {
        console.error('Failed to load employee data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployeeData();
  }, [selectedEmployee]);

  const employee = employeeData[selectedEmployee];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading employee data...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No employee data available. Please add team members to view individual performance.</p>
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
