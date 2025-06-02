
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
            daysOverdue: Math.floor((today.getTime() - task.dueDate!.getTime()) / (1000 * 60 * 60 * 24)),
            originalDueDate: task.dueDate!.toISOString().split('T')[0]
          }));
          
          const overdueOutputs = outputs.filter(output => 
            output.progress < 100 && !output.isDeleted && output.dueDate && output.dueDate < today
          ).map(output => ({
            id: output.id,
            title: output.title,
            progress: output.progress,
            daysOverdue: Math.floor((today.getTime() - output.dueDate!.getTime()) / (1000 * 60 * 60 * 24)),
            originalDueDate: output.dueDate!.toISOString().split('T')[0]
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
          const weeklyOutputs = outputs
            .filter(output => !output.isDeleted)
            .map(output => ({
              id: output.id,
              title: output.title,
              progress: output.progress,
              dueDate: output.dueDate?.toISOString().split('T')[0] || ''
            }));

          // Calculate completion rates for stats
          const completedHabits = habits.filter(h => h.completed && !h.archived).length;
          const totalHabits = habits.filter(h => !h.archived).length;
          const habitsCompletionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
          
          const completedTasks = tasks.filter(t => t.completed && !t.isDeleted).length;
          const totalTasks = tasks.filter(t => !t.isDeleted).length;
          const tasksCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          
          const completedOutputs = outputs.filter(o => o.progress === 100 && !o.isDeleted).length;
          const totalOutputs = outputs.filter(o => !o.isDeleted).length;
          const outputsCompletionRate = totalOutputs > 0 ? Math.round((completedOutputs / totalOutputs) * 100) : 0;
          
          const maxStreak = Math.max(...habits.map(h => h.streak), 0);
          const currentStreak = habits.filter(h => h.completed).reduce((sum, h) => sum + h.streak, 0) / Math.max(habits.filter(h => h.completed).length, 1);
          
          data[member.id] = {
            id: member.id,
            name: member.name,
            role: member.position || 'Team Member',
            email: member.email,
            avatar: member.name.charAt(0).toUpperCase(),
            stats: {
              habitsCompletionRate,
              tasksCompletionRate,
              outputsCompletionRate,
              bestStreak: Math.round(maxStreak),
              currentStreak: Math.round(currentStreak)
            },
            overdueTasks,
            overdueOutputs,
            habits: habits.filter(h => !h.archived).map(habit => ({
              name: habit.name,
              completed: habit.completed,
              streak: habit.streak
            })),
            recentTasks,
            weeklyOutputs
          };
        });
        
        setEmployeeData(data);
        
        // Auto-select first employee if none selected and there are team members
        if (!selectedEmployee && teamMembers.length > 0) {
          setSelectedEmployee(teamMembers[0].id);
        }
        
        console.log('Employee data loaded:', data);
        console.log('Selected employee:', selectedEmployee);
      } catch (error) {
        console.error('Failed to load employee data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployeeData();
  }, []); // Remove selectedEmployee from dependency array to prevent infinite loops

  // Update selected employee when it changes
  useEffect(() => {
    console.log('Selected employee changed to:', selectedEmployee);
  }, [selectedEmployee]);

  const employee = selectedEmployee ? employeeData[selectedEmployee] : null;

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading employee data...</p>
      </div>
    );
  }

  if (Object.keys(employeeData).length === 0) {
    return (
      <div className="space-y-6">
        <EmployeeSelector 
          selectedEmployee={selectedEmployee} 
          onEmployeeChange={setSelectedEmployee} 
        />
        <div className="text-center py-8">
          <p className="text-gray-500">No team members available. Please add team members to view individual performance.</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <EmployeeSelector 
          selectedEmployee={selectedEmployee} 
          onEmployeeChange={setSelectedEmployee} 
        />
        <div className="text-center py-8">
          <p className="text-gray-500">Please select a team member to view their performance.</p>
        </div>
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
