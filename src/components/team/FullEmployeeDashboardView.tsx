
import React, { useState, useMemo, useEffect } from 'react';
import { DateNavigator } from '../DateNavigator';
import { EmployeeData } from '@/types/individualData';
import { EmployeeDashboardHeader } from './EmployeeDashboardHeader';
import { EmployeeStatsGrid } from './EmployeeStatsGrid';
import { EmployeeDashboardLayout } from './EmployeeDashboardLayout';
import { createReadOnlyHandlers } from '@/utils/employeeDashboardTransformer';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { Habit, Task, WeeklyOutput } from '@/types/productivity';
import { format } from 'date-fns';

interface FullEmployeeDashboardViewProps {
  employee: EmployeeData;
  onBack: () => void;
}

export const FullEmployeeDashboardView = ({ employee, onBack }: FullEmployeeDashboardViewProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [actualHabits, setActualHabits] = useState<Habit[]>([]);
  const [actualTasks, setActualTasks] = useState<Task[]>([]);
  const [actualWeeklyOutputs, setActualWeeklyOutputs] = useState<WeeklyOutput[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Fetch all historical data when date changes
  useEffect(() => {
    const fetchAllDataForDate = async () => {
      setIsLoadingData(true);
      try {
        console.log('Fetching all data for employee:', employee.id, 'date:', format(selectedDate, 'yyyy-MM-dd'));
        
        // Fetch all data in parallel
        const [habits, tasks, weeklyOutputs] = await Promise.all([
          supabaseDataService.getHabitsForDate(employee.id, selectedDate),
          supabaseDataService.getTasks(employee.id),
          supabaseDataService.getWeeklyOutputs(employee.id)
        ]);

        console.log('Fetched historical data for employee:', employee.id, {
          habits: habits.length,
          tasks: tasks.length,
          weeklyOutputs: weeklyOutputs.length
        });

        setActualHabits(habits);
        setActualTasks(tasks.filter(t => !t.isDeleted));
        setActualWeeklyOutputs(weeklyOutputs.filter(w => !w.isDeleted));
      } catch (error) {
        console.error('Error fetching historical data for employee:', employee.id, error);
        // Fallback to empty arrays on error
        setActualHabits([]);
        setActualTasks([]);
        setActualWeeklyOutputs([]);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchAllDataForDate();
  }, [employee.id, selectedDate]);

  // Calculate overdue items from actual data
  const overdueData = useMemo(() => {
    const today = new Date();
    const overdueTasks = actualTasks.filter(task => 
      !task.completed && task.dueDate < today
    );
    const overdueOutputs = actualWeeklyOutputs.filter(output => 
      output.progress < 100 && output.dueDate < today
    );

    return { overdueTasks, overdueOutputs };
  }, [actualTasks, actualWeeklyOutputs]);

  const readOnlyHandlers = {
    ...createReadOnlyHandlers(),
    handleDateChange: setSelectedDate, // Only allow date navigation
  };

  // Helper function to get tasks by date for TasksSection
  const getTasksByDate = (date: Date) => {
    return actualTasks.filter(task => 
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

        {isLoadingData ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading historical data for {format(selectedDate, 'MMM d, yyyy')}...</p>
          </div>
        ) : (
          <EmployeeDashboardLayout
            transformedHabits={actualHabits}
            transformedTasks={actualTasks}
            transformedOverdueTasks={overdueData.overdueTasks}
            transformedWeeklyOutputs={actualWeeklyOutputs}
            transformedOverdueOutputs={overdueData.overdueOutputs}
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
