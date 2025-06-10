
import React, { useState } from 'react';
import { Target, CheckCircle, Clock, Award } from 'lucide-react';
import { QuickStatsCard } from '../QuickStatsCard';
import { FeelingTracker } from '../FeelingTracker';
import { HabitsSection } from '../HabitsSection';
import { WeeklyOutputsSection } from '../WeeklyOutputsSection';
import { TasksSection } from '../TasksSection';
import { DateNavigator } from '../DateNavigator';
import { EmployeeData } from '@/types/individualData';
import { useProductivity } from '@/hooks/useProductivity';

interface FullEmployeeDashboardViewProps {
  employee: EmployeeData;
  onBack: () => void;
}

export const FullEmployeeDashboardView = ({ employee, onBack }: FullEmployeeDashboardViewProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // This is a read-only view, so we'll create mock handlers for the employee's data
  const mockHandlers = {
    handleDateChange: setSelectedDate,
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  const transformedTasks = employee.recentTasks.map(t => ({
    id: t.id,
    title: t.title,
    completed: t.completed,
    dueDate: new Date(t.dueDate),
    priority: t.priority as 'Low' | 'Medium' | 'High',
    description: '',
    userId: employee.id,
    isDeleted: false,
    createdDate: new Date(),
    updatedAt: new Date(),
    originalDueDate: new Date(t.dueDate),
    isMoved: false
  }));

  const transformedWeeklyOutputs = employee.weeklyOutputs.map(o => ({
    id: o.id,
    title: o.title,
    progress: o.progress,
    dueDate: new Date(o.dueDate),
    description: '',
    userId: employee.id,
    isDeleted: false,
    createdDate: new Date(),
    updatedAt: new Date(),
    originalDueDate: new Date(o.dueDate)
  }));

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

        {/* Date Navigation */}
        <div className="flex justify-center mb-4">
          <DateNavigator 
            selectedDate={selectedDate} 
            onDateChange={setSelectedDate}
          />
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
            <HabitsSection 
              habits={transformedHabits}
              selectedDate={selectedDate}
              onToggleHabit={mockHandlers.toggleHabit}
              onAddHabit={mockHandlers.addHabit}
              onEditHabit={mockHandlers.editHabit}
              isReadOnly={true}
            />
          </div>

          <div className="lg:col-span-1">
            <WeeklyOutputsSection
              weeklyOutputs={transformedWeeklyOutputs}
              deletedWeeklyOutputs={[]}
              onAddWeeklyOutput={mockHandlers.addWeeklyOutput}
              onEditWeeklyOutput={mockHandlers.editWeeklyOutput}
              onUpdateProgress={mockHandlers.updateProgress}
              onMoveWeeklyOutput={mockHandlers.moveWeeklyOutput}
              onDeleteWeeklyOutput={mockHandlers.deleteWeeklyOutput}
              onRestoreWeeklyOutput={mockHandlers.restoreWeeklyOutput}
              onPermanentlyDeleteWeeklyOutput={mockHandlers.permanentlyDeleteWeeklyOutput}
              isReadOnly={true}
            />
          </div>

          <div className="lg:col-span-1">
            <TasksSection
              tasks={transformedTasks}
              deletedTasks={[]}
              selectedDate={selectedDate}
              onAddTask={mockHandlers.addTask}
              onEditTask={mockHandlers.editTask}
              onToggleTask={mockHandlers.toggleTask}
              onDeleteTask={mockHandlers.deleteTask}
              onRestoreTask={mockHandlers.restoreTask}
              onPermanentlyDeleteTask={mockHandlers.permanentlyDeleteTask}
              onRollOverTask={mockHandlers.rollOverTask}
              isReadOnly={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
