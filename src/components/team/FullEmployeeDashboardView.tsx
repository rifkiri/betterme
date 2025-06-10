
import React, { useState, useMemo, useEffect } from 'react';
import { DateNavigator } from '../DateNavigator';
import { EmployeeData } from '@/types/individualData';
import { EmployeeDashboardHeader } from './EmployeeDashboardHeader';
import { EmployeeStatsGrid } from './EmployeeStatsGrid';
import { EmployeeDashboardLayout } from './EmployeeDashboardLayout';
import { transformEmployeeDataForDashboard, createReadOnlyHandlers } from '@/utils/employeeDashboardTransformer';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { Habit } from '@/types/productivity';
import { format } from 'date-fns';

interface FullEmployeeDashboardViewProps {
  employee: EmployeeData;
  onBack: () => void;
}

export const FullEmployeeDashboardView = ({ employee, onBack }: FullEmployeeDashboardViewProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [actualHabits, setActualHabits] = useState<Habit[]>([]);
  const [isLoadingHabits, setIsLoadingHabits] = useState(false);
  
  // Fetch actual historical habit data when date changes
  useEffect(() => {
    const fetchHabitsForDate = async () => {
      setIsLoadingHabits(true);
      try {
        console.log('Fetching habits for employee:', employee.id, 'date:', format(selectedDate, 'yyyy-MM-dd'));
        const habits = await supabaseDataService.getHabitsForDate(employee.id, selectedDate);
        console.log('Fetched actual habits for date:', habits);
        setActualHabits(habits);
      } catch (error) {
        console.error('Error fetching habits for date:', error);
        // Fallback to transformed data if fetch fails
        const { transformedHabits } = transformEmployeeDataForDashboard(employee);
        setActualHabits(transformedHabits);
      } finally {
        setIsLoadingHabits(false);
      }
    };

    fetchHabitsForDate();
  }, [employee.id, selectedDate]);
  
  // Transform employee data for other sections (tasks, outputs) - recalculate when date changes
  const transformedData = useMemo(() => {
    const {
      transformedTasks,
      transformedOverdueTasks,
      transformedWeeklyOutputs,
      transformedOverdueOutputs
    } = transformEmployeeDataForDashboard(employee);

    return {
      transformedTasks,
      transformedOverdueTasks,
      transformedWeeklyOutputs,
      transformedOverdueOutputs
    };
  }, [employee]);

  const readOnlyHandlers = {
    ...createReadOnlyHandlers(),
    handleDateChange: setSelectedDate, // Only allow date navigation
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

        {isLoadingHabits ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading habit data for {format(selectedDate, 'MMM d, yyyy')}...</p>
          </div>
        ) : (
          <EmployeeDashboardLayout
            transformedHabits={actualHabits}
            transformedTasks={transformedData.transformedTasks}
            transformedOverdueTasks={transformedData.transformedOverdueTasks}
            transformedWeeklyOutputs={transformedData.transformedWeeklyOutputs}
            transformedOverdueOutputs={transformedData.transformedOverdueOutputs}
            selectedDate={selectedDate}
            mockHandlers={readOnlyHandlers}
            getTasksByDate={getTasksByDate}
            isViewOnly={true}
          />
        )}
      </div>
    </div>
  );
};
