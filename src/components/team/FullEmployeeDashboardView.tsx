
import React, { useState, useMemo, useEffect } from 'react';
import { DateNavigator } from '../DateNavigator';
import { EmployeeData } from '@/types/individualData';
import { EmployeeDashboardHeader } from './EmployeeDashboardHeader';
import { EmployeeStatsGrid } from './EmployeeStatsGrid';
import { EmployeeDashboardLayout } from './EmployeeDashboardLayout';
import { createReadOnlyHandlers } from '@/utils/employeeDashboardTransformer';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { Habit, Task, WeeklyOutput } from '@/types/productivity';
import { format, subDays } from 'date-fns';

interface FullEmployeeDashboardViewProps {
  employee: EmployeeData;
  onBack: () => void;
}

export const FullEmployeeDashboardView = ({ employee, onBack }: FullEmployeeDashboardViewProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [allHabits, setAllHabits] = useState<Habit[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allWeeklyOutputs, setAllWeeklyOutputs] = useState<WeeklyOutput[]>([]);
  const [habitsForSelectedDate, setHabitsForSelectedDate] = useState<Habit[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Fetch all comprehensive historical data
  useEffect(() => {
    const fetchAllHistoricalData = async () => {
      setIsLoadingData(true);
      try {
        console.log('Fetching comprehensive historical data for employee:', employee.id);
        
        // Fetch all data in parallel
        const [allTasksData, allWeeklyOutputsData] = await Promise.all([
          supabaseDataService.getTasks(employee.id),
          supabaseDataService.getWeeklyOutputs(employee.id)
        ]);

        console.log('Fetched comprehensive historical data for employee:', employee.id, {
          tasks: allTasksData.length,
          weeklyOutputs: allWeeklyOutputsData.length
        });

        setAllTasks(allTasksData.filter(t => !t.isDeleted));
        setAllWeeklyOutputs(allWeeklyOutputsData.filter(w => !w.isDeleted));
      } catch (error) {
        console.error('Error fetching comprehensive historical data for employee:', employee.id, error);
        // Fallback to empty arrays on error
        setAllTasks([]);
        setAllWeeklyOutputs([]);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchAllHistoricalData();
  }, [employee.id]);

  // Fetch habits for the selected date specifically
  useEffect(() => {
    const fetchHabitsForDate = async () => {
      try {
        console.log('Fetching habits for employee:', employee.id, 'date:', format(selectedDate, 'yyyy-MM-dd'));
        
        const habitsData = await supabaseDataService.getHabitsForDate(employee.id, selectedDate);
        console.log('Fetched habits for date:', format(selectedDate, 'yyyy-MM-dd'), habitsData);
        
        setHabitsForSelectedDate(habitsData.filter(h => !h.archived && !h.isDeleted));
        
        // Also fetch all habits (not date-specific) for comprehensive view
        const allHabitsData = await supabaseDataService.getHabits(employee.id);
        setAllHabits(allHabitsData.filter(h => !h.archived && !h.isDeleted));
      } catch (error) {
        console.error('Error fetching habits for date for employee:', employee.id, error);
        setHabitsForSelectedDate([]);
        setAllHabits([]);
      }
    };

    fetchHabitsForDate();
  }, [employee.id, selectedDate]);

  // Calculate overdue items from all historical data
  const overdueData = useMemo(() => {
    const today = new Date();
    const overdueTasks = allTasks.filter(task => 
      !task.completed && task.dueDate < today
    );
    const overdueOutputs = allWeeklyOutputs.filter(output => 
      output.progress < 100 && output.dueDate < today
    );

    return { overdueTasks, overdueOutputs };
  }, [allTasks, allWeeklyOutputs]);

  // Filter tasks and outputs relevant to the selected date
  const tasksForSelectedDate = useMemo(() => {
    return allTasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
      const taskDateString = format(taskDate, 'yyyy-MM-dd');
      return taskDateString === selectedDateString;
    });
  }, [allTasks, selectedDate]);

  // Get weekly outputs that are relevant (due within the week of selected date)
  const weeklyOutputsForView = useMemo(() => {
    // Show all weekly outputs for comprehensive view, but could be filtered by week if needed
    return allWeeklyOutputs;
  }, [allWeeklyOutputs]);

  const readOnlyHandlers = {
    ...createReadOnlyHandlers(),
    handleDateChange: setSelectedDate, // Only allow date navigation
  };

  // Helper function to get tasks by date for TasksSection
  const getTasksByDate = (date: Date) => {
    return allTasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return format(taskDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
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
          <div className="space-y-4">
            {/* Show date-specific information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Data for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Habits Completed:</span> {habitsForSelectedDate.filter(h => h.completed).length}/{habitsForSelectedDate.length}
                </div>
                <div>
                  <span className="font-medium">Tasks Due:</span> {tasksForSelectedDate.length}
                </div>
                <div>
                  <span className="font-medium">Tasks Completed:</span> {tasksForSelectedDate.filter(t => t.completed).length}
                </div>
              </div>
            </div>

            {/* Historical overview */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Historical Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Habits:</span> {allHabits.length}
                </div>
                <div>
                  <span className="font-medium">Total Tasks:</span> {allTasks.length}
                </div>
                <div>
                  <span className="font-medium">Total Weekly Outputs:</span> {allWeeklyOutputs.length}
                </div>
                <div>
                  <span className="font-medium">Overdue Items:</span> {overdueData.overdueTasks.length + overdueData.overdueOutputs.length}
                </div>
              </div>
            </div>

            <EmployeeDashboardLayout
              transformedHabits={habitsForSelectedDate}
              transformedTasks={allTasks}
              transformedOverdueTasks={overdueData.overdueTasks}
              transformedWeeklyOutputs={weeklyOutputsForView}
              transformedOverdueOutputs={overdueData.overdueOutputs}
              selectedDate={selectedDate}
              mockHandlers={readOnlyHandlers}
              getTasksByDate={getTasksByDate}
              isViewOnly={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};
