
import { useState } from 'react';
import { useProductivity } from '@/hooks/useProductivity';
import { HabitsSection } from '@/components/HabitsSection';
import { TasksSection } from '@/components/TasksSection';
import { WeeklyOutputsSection } from '@/components/WeeklyOutputsSection';
import { ProjectsSection } from '@/components/ProjectsSection';
import { DateNavigator } from '@/components/DateNavigator';
import { FeelingTracker } from '@/components/FeelingTracker';
import { AppNavigation } from '@/components/AppNavigation';

const Index = () => {
  const productivity = useProductivity();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Productivity Tracker</h1>
            <p className="text-gray-600">Track your habits, tasks, and weekly outputs</p>
          </div>
          
          <DateNavigator 
            selectedDate={productivity.selectedDate}
            onDateChange={productivity.handleDateChange}
          />
          
          <FeelingTracker />
          
          <HabitsSection
            habits={productivity.habits}
            archivedHabits={productivity.archivedHabits}
            onToggleHabit={productivity.toggleHabit}
            onAddHabit={productivity.addHabit}
            onEditHabit={productivity.editHabit}
            onArchiveHabit={productivity.archiveHabit}
            onRestoreHabit={productivity.restoreHabit}
            onPermanentlyDeleteHabit={productivity.permanentlyDeleteHabit}
            selectedDate={productivity.selectedDate}
            onDateChange={productivity.handleDateChange}
          />
          
          <TasksSection
            tasks={productivity.tasks}
            deletedTasks={productivity.deletedTasks}
            overdueTasks={productivity.getOverdueTasks()}
            onAddTask={productivity.addTask}
            onEditTask={productivity.editTask}
            onToggleTask={productivity.toggleTask}
            onMoveTask={productivity.rollOverTask}
            onDeleteTask={productivity.deleteTask}
            onRestoreTask={productivity.restoreTask}
            onPermanentlyDeleteTask={productivity.permanentlyDeleteTask}
            getTasksByDate={productivity.getTasksByDate}
            weeklyOutputs={productivity.weeklyOutputs}
          />
          
          <WeeklyOutputsSection
            weeklyOutputs={productivity.weeklyOutputs}
            onAddWeeklyOutput={productivity.addWeeklyOutput}
            onEditOutput={productivity.editWeeklyOutput}
            onUpdateProgress={productivity.updateProgress}
            onDeleteOutput={productivity.deleteWeeklyOutput}
            projects={productivity.projects}
          />
          
          <ProjectsSection
            projects={productivity.projects}
            deletedProjects={productivity.deletedProjects}
            overdueProjects={productivity.getOverdueProjects()}
            onAddProject={productivity.addProject}
            onEditProject={productivity.editProject}
            onUpdateProgress={productivity.updateProgress}
            onDeleteProject={productivity.deleteProject}
            onRestoreProject={productivity.restoreProject}
            onPermanentlyDeleteProject={productivity.permanentlyDeleteProject}
            tasks={productivity.tasks}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
