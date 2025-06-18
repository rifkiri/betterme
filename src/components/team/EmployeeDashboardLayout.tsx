
import React from 'react';
import { HabitsSection } from '../HabitsSection';
import { WeeklyOutputsSection } from '../WeeklyOutputsSection';
import { TasksSection } from '../TasksSection';
import { Habit, Task, WeeklyOutput } from '@/types/productivity';

interface EmployeeDashboardLayoutProps {
  transformedHabits: Habit[];
  transformedTasks: Task[];
  transformedOverdueTasks: Task[];
  transformedWeeklyOutputs: WeeklyOutput[];
  transformedOverdueOutputs: WeeklyOutput[];
  selectedDate: Date;
  mockHandlers: any;
  getTasksByDate: (date: Date) => Task[];
  isViewOnly?: boolean;
}

export const EmployeeDashboardLayout = ({
  transformedHabits,
  transformedTasks,
  transformedOverdueTasks,
  transformedWeeklyOutputs,
  transformedOverdueOutputs,
  selectedDate,
  mockHandlers,
  getTasksByDate,
  isViewOnly = true
}: EmployeeDashboardLayoutProps) => {
  return (
    <div className="space-y-2 sm:space-y-4 lg:grid lg:grid-cols-3 lg:gap-3 xl:gap-6 lg:space-y-0">
      <div className="lg:col-span-1 space-y-2 sm:space-y-4">
        <HabitsSection 
          habits={transformedHabits}
          archivedHabits={[]}
          selectedDate={selectedDate}
          onDateChange={mockHandlers.handleDateChange}
          onToggleHabit={mockHandlers.toggleHabit}
          onAddHabit={mockHandlers.addHabit}
          onEditHabit={mockHandlers.editHabit}
          onArchiveHabit={mockHandlers.archiveHabit}
          onRestoreHabit={mockHandlers.restoreHabit}
          onPermanentlyDeleteHabit={mockHandlers.permanentlyDeleteHabit}
        />
      </div>

      <div className="lg:col-span-1">
        <WeeklyOutputsSection
          weeklyOutputs={transformedWeeklyOutputs}
          deletedWeeklyOutputs={[]}
          overdueWeeklyOutputs={transformedOverdueOutputs}
          onAddWeeklyOutput={mockHandlers.addWeeklyOutput}
          onEditOutput={mockHandlers.editWeeklyOutput}
          onUpdateProgress={mockHandlers.updateProgress}
          onDeleteOutput={mockHandlers.deleteWeeklyOutput}
          onRestoreWeeklyOutput={mockHandlers.restoreWeeklyOutput}
          onPermanentlyDeleteWeeklyOutput={mockHandlers.permanentlyDeleteWeeklyOutput}
          onMoveWeeklyOutput={mockHandlers.moveWeeklyOutput}
          projects={[]}
        />
      </div>

      <div className="lg:col-span-1">
        <TasksSection
          tasks={transformedTasks}
          deletedTasks={[]}
          overdueTasks={transformedOverdueTasks}
          onAddTask={mockHandlers.addTask}
          onEditTask={mockHandlers.editTask}
          onToggleTask={mockHandlers.toggleTask}
          onMoveTask={mockHandlers.moveTask}
          onDeleteTask={mockHandlers.deleteTask}
          onRestoreTask={mockHandlers.restoreTask}
          onPermanentlyDeleteTask={mockHandlers.permanentlyDeleteTask}
          getTasksByDate={getTasksByDate}
          weeklyOutputs={transformedWeeklyOutputs}
        />
      </div>
    </div>
  );
};
