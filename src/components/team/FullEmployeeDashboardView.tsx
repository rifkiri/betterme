
import React, { useState, useMemo } from 'react';
import { DateNavigator } from '../DateNavigator';
import { EmployeeData } from '@/types/individualData';
import { EmployeeDashboardHeader } from './EmployeeDashboardHeader';
import { EmployeeStatsGrid } from './EmployeeStatsGrid';
import { EmployeeDashboardLayout } from './EmployeeDashboardLayout';
import { transformEmployeeDataForDashboard, createMockHandlers } from '@/utils/employeeDashboardTransformer';
import { format } from 'date-fns';

interface FullEmployeeDashboardViewProps {
  employee: EmployeeData;
  onBack: () => void;
}

export const FullEmployeeDashboardView = ({ employee, onBack }: FullEmployeeDashboardViewProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Transform employee data and create mock handlers - recalculate when date changes
  const transformedData = useMemo(() => {
    const {
      transformedHabits,
      transformedTasks,
      transformedOverdueTasks,
      transformedWeeklyOutputs,
      transformedOverdueOutputs
    } = transformEmployeeDataForDashboard(employee);

    // Update habits completion status based on selected date
    // For demo purposes, we'll simulate different completion patterns for different dates
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const updatedHabits = transformedHabits.map(habit => {
      // Simulate different completion patterns based on date
      let completed = false;
      
      if (dateString === today) {
        // Use original completion status for today
        completed = habit.completed;
      } else {
        // For other dates, simulate different completion patterns
        const dayOfMonth = selectedDate.getDate();
        const habitIndex = transformedHabits.indexOf(habit);
        
        // Create a deterministic but varied pattern based on date and habit
        completed = (dayOfMonth + habitIndex) % 3 !== 0;
      }
      
      return {
        ...habit,
        completed
      };
    });

    return {
      transformedHabits: updatedHabits,
      transformedTasks,
      transformedOverdueTasks,
      transformedWeeklyOutputs,
      transformedOverdueOutputs
    };
  }, [employee, selectedDate]);

  const mockHandlers = {
    ...createMockHandlers(),
    handleDateChange: setSelectedDate,
  };

  // Helper function to get tasks by date for TasksSection
  const getTasksByDate = (date: Date) => {
    return transformedData.transformedTasks.filter(task => 
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
          transformedHabits={transformedData.transformedHabits}
          transformedTasks={transformedData.transformedTasks}
          transformedOverdueTasks={transformedData.transformedOverdueTasks}
          transformedWeeklyOutputs={transformedData.transformedWeeklyOutputs}
          transformedOverdueOutputs={transformedData.transformedOverdueOutputs}
          selectedDate={selectedDate}
          mockHandlers={mockHandlers}
          getTasksByDate={getTasksByDate}
        />
      </div>
    </div>
  );
};
