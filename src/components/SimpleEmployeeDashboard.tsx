
import React from "react";
import { useProductivity } from "@/hooks/useProductivity";
import { HabitsSection } from "./HabitsSection";
import { TasksSection } from "./TasksSection";
import { WeeklyOutputsSection } from "./WeeklyOutputsSection";
import { FeelingTracker } from "./FeelingTracker";
import { DateNavigator } from "./DateNavigator";
import { QuickStatsCard } from "./QuickStatsCard";
import { TeamMemberOverview } from "./team/TeamMemberOverview";
import { useUserProfile } from "@/hooks/useUserProfile";

export const SimpleEmployeeDashboard = () => {
  const {
    selectedDate,
    habits,
    archivedHabits,
    tasks,
    deletedTasks,
    weeklyOutputs,
    isLoading,
    handleDateChange,
    toggleHabit,
    toggleTask,
    addHabit,
    editHabit,
    addTask,
    editTask,
    deleteTask,
    restoreTask,
    permanentlyDeleteTask,
    addWeeklyOutput,
    editWeeklyOutput,
    deleteWeeklyOutput,
    rollOverTask,
    moveWeeklyOutput,
    archiveHabit,
    restoreHabit,
    permanentlyDeleteHabit,
    getTasksByDate,
    getOverdueTasks
  } = useProductivity();

  const { profile } = useUserProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your productivity data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Productivity</h1>
        <p className="text-gray-600">Track your daily habits, tasks, and weekly outputs</p>
      </div>

      {/* Team Overview Section for Team Members */}
      {profile?.role === 'team-member' && (
        <div className="mb-8">
          <TeamMemberOverview />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-3">
          <DateNavigator selectedDate={selectedDate} onDateChange={handleDateChange} />
        </div>
        <div className="lg:col-span-1">
          <QuickStatsCard 
            habits={habits} 
            tasks={tasks} 
            weeklyOutputs={weeklyOutputs} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <HabitsSection
          habits={habits}
          archivedHabits={archivedHabits}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          onToggleHabit={toggleHabit}
          onAddHabit={addHabit}
          onEditHabit={editHabit}
          onArchiveHabit={archiveHabit}
          onRestoreHabit={restoreHabit}
          onPermanentlyDeleteHabit={permanentlyDeleteHabit}
        />
        
        <TasksSection
          tasks={tasks}
          deletedTasks={deletedTasks}
          overdueTasks={getOverdueTasks()}
          onAddTask={addTask}
          onEditTask={editTask}
          onToggleTask={toggleTask}
          onMoveTask={rollOverTask}
          onDeleteTask={deleteTask}
          onRestoreTask={restoreTask}
          onPermanentlyDeleteTask={permanentlyDeleteTask}
          getTasksByDate={getTasksByDate}
          weeklyOutputs={weeklyOutputs}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WeeklyOutputsSection
          weeklyOutputs={weeklyOutputs}
          onAddWeeklyOutput={addWeeklyOutput}
          onEditWeeklyOutput={editWeeklyOutput}
          onDeleteWeeklyOutput={deleteWeeklyOutput}
          onMoveWeeklyOutput={moveWeeklyOutput}
          selectedDate={selectedDate}
        />
        
        <FeelingTracker selectedDate={selectedDate} />
      </div>
    </div>
  );
};
