
import React from 'react';
import { Target, CheckCircle, Clock, Award } from 'lucide-react';
import { QuickStatsCard } from '../QuickStatsCard';
import { FeelingTracker } from '../FeelingTracker';
import { HabitsSection } from '../HabitsSection';
import { WeeklyOutputsSection } from '../WeeklyOutputsSection';
import { TasksSection } from '../TasksSection';
import { EmployeeData } from '@/types/individualData';
import { useProductivity } from '@/hooks/useProductivity';

interface FullEmployeeDashboardViewProps {
  employee: EmployeeData;
  onBack: () => void;
}

export const FullEmployeeDashboardView = ({ employee, onBack }: FullEmployeeDashboardViewProps) => {
  // This is a read-only view, so we'll create mock handlers for the employee's data
  const mockHandlers = {
    handleDateChange: () => {},
    addHabit: () => {},
    editHabit: () => {},
    addTask: () => {},
    editTask: () => {},
    addWeeklyOutput: () => {},
    editWeeklyOutput: () => {},
    toggleHabit: () => {},
    toggleTask: () => {},
    deleteTask: () => {},
    restoreTask: () => {},
    permanentlyDeleteTask: () => {},
    archiveHabit: () => {},
    restoreHabit: () => {},
    permanentlyDeleteHabit: () => {},
    rollOverTask: () => {},
    updateProgress: () => {},
    moveWeeklyOutput: () => {},
    deleteWeeklyOutput: () => {},
    restoreWeeklyOutput: () => {},
    permanentlyDeleteWeeklyOutput: () => {},
  };

  // Calculate stats from employee data
  const completedHabits = employee.habits.filter(habit => habit.completed).length;
  const todaysTasksCompleted = employee.recentTasks.filter(t => t.completed).length;
  const overdueCount = employee.overdueTasks.length + employee.overdueOutputs.length;

  // Transform employee data to match productivity types
  const transformedHabits = employee.habits.map(h => ({
    id: `habit-${h.name}`,
    name: h.name,
    completed: h.completed,
    streak: h.streak,
    category: '',
    description: '',
    userId: employee.id,
    archived: false,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  const transformedTasks = employee.recentTasks.map(t => ({
    id: t.id,
    title: t.title,
    completed: t.completed,
    dueDate: new Date(t.dueDate),
    priority: t.priority,
    description: '',
    userId: employee.id,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    originalDueDate: new Date(t.dueDate)
  }));

  const transformedWeeklyOutputs = employee.weeklyOutputs.map(o => ({
    id: o.id,
    title: o.title,
    progress: o.progress,
    dueDate: new Date(o.dueDate),
    description: '',
    userId: employee.id,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    originalDueDate: new Date(o.dueDate)
  }));

  const selectedDate = new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-1 sm:p-2 lg:p-4">
      <div className="max-w-full mx-auto space-y-2 sm:space-y-4">
        {/* Header with back button */}
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

        {/* Quick Stats */}
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

        {/* Dashboard Layout */}
        <div className="space-y-2 sm:space-y-4 lg:grid lg:grid-cols-3 lg:gap-3 xl:gap-6 lg:space-y-0">
          <div className="lg:col-span-1 space-y-2 sm:space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-sm text-gray-500 mb-2">Mood Tracking (Read-only)</div>
              <div className="text-2xl font-bold text-blue-600">View Only</div>
              <div className="text-sm text-gray-600">Manager cannot modify employee mood</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-sm text-gray-500 mb-2">Daily Habits (Read-only)</div>
              <div className="space-y-2">
                {transformedHabits.map(habit => (
                  <div key={habit.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${habit.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">{habit.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{habit.streak} day streak</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-sm text-gray-500 mb-2">Weekly Outputs (Read-only)</div>
              <div className="space-y-3">
                {transformedWeeklyOutputs.map(output => (
                  <div key={output.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{output.title}</span>
                      <span className="text-xs text-gray-500">
                        Due: {output.dueDate.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${output.progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600">{output.progress}% complete</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-sm text-gray-500 mb-2">Recent Tasks (Read-only)</div>
              <div className="space-y-2">
                {transformedTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${task.completed ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <div>
                        <div className="text-sm font-medium">{task.title}</div>
                        <div className="text-xs text-gray-500">
                          Due: {task.dueDate.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-200 rounded">{task.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
