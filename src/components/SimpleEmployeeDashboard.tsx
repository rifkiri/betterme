
import { Target, CheckCircle, Clock, Award } from 'lucide-react';
import { useProductivity } from '@/hooks/useProductivity';
import { QuickStatsCard } from './QuickStatsCard';
import { FeelingTracker } from './FeelingTracker';
import { HabitsSection } from './HabitsSection';
import { useUserProfile } from '@/hooks/useUserProfile';
import { WeeklyOutputsSection } from './WeeklyOutputsSection';
import { TasksSection } from './TasksSection';

export const SimpleEmployeeDashboard = () => {
  console.log('SimpleEmployeeDashboard rendering...');
  
  const { profile } = useUserProfile();
  
  const {
    habits,
    archivedHabits,
    tasks,
    deletedTasks,
    weeklyOutputs,
    deletedWeeklyOutputs,
    goals,
    isLoading,
    selectedDate,
    handleDateChange,
    addHabit,
    editHabit,
    addTask,
    editTask,
    addWeeklyOutput,
    editWeeklyOutput,
    toggleHabit,
    toggleTask,
    deleteTask,
    restoreTask,
    permanentlyDeleteTask,
    archiveHabit,
    restoreHabit,
    permanentlyDeleteHabit,
    rollOverTask,
    getTodaysTasks,
    getOverdueTasks,
    getTasksByDate,
    updateProgress,
    moveWeeklyOutput,
    deleteWeeklyOutput,
    restoreWeeklyOutput,
    permanentlyDeleteWeeklyOutput,
    getOverdueWeeklyOutputs,
    loadAllData
  } = useProductivity();

  console.log('Dashboard data:', {
    habitsCount: habits.length,
    tasksCount: tasks.length,
    weeklyOutputsCount: weeklyOutputs.length
  });

  const completedHabits = habits.filter(habit => habit.completed).length;
  const todaysTasks = getTodaysTasks();
  const overdueTasks = getOverdueTasks();
  const overdueWeeklyOutputs = getOverdueWeeklyOutputs();
  const bestStreak = Math.max(...habits.map(h => h.streak), 0);

  console.log('Today tasks:', todaysTasks.length, 'Overdue tasks:', overdueTasks.length, 'Overdue weekly outputs:', overdueWeeklyOutputs.length);

  const handleRollOver = (taskId: string, targetDate: Date) => {
    rollOverTask(taskId, targetDate);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-1 sm:p-2 lg:p-4">
      <div className="max-w-full mx-auto space-y-2 sm:space-y-4">
        {/* Header */}
        <div className="text-center mb-2 sm:mb-4 px-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">My Productivity</h1>
          <p className="text-gray-600 text-xs sm:text-sm lg:text-base">Track your habits, achieve your goals, manage tasks, and plan your week</p>
        </div>

        {/* Quick Stats - 4 main cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-2 lg:gap-4 mb-2 sm:mb-4 px-1 sm:px-2">
          <QuickStatsCard 
            title="Habits Today" 
            value={`${completedHabits}/${habits.length}`} 
            icon={Target} 
            gradient="bg-gradient-to-r from-blue-50 to-blue-100" 
          />
          <QuickStatsCard 
            title="Best Streak" 
            value={bestStreak.toString()} 
            icon={Award} 
            gradient="bg-gradient-to-r from-purple-50 to-purple-100" 
          />
          <QuickStatsCard 
            title="Today's Tasks" 
            value={`${todaysTasks.filter(t => t.completed).length}/${todaysTasks.length}`} 
            icon={CheckCircle} 
            gradient="bg-gradient-to-r from-green-50 to-green-100" 
          />
          <QuickStatsCard 
            title="Overdue" 
            value={(overdueTasks.length + overdueWeeklyOutputs.length).toString()} 
            icon={Clock} 
            gradient="bg-gradient-to-r from-orange-50 to-orange-100" 
          />
        </div>

        {/* Horizontal Mood Section */}
        <div className="mb-2 sm:mb-4 px-1 sm:px-2">
          <FeelingTracker />
        </div>

        {/* 3-Column Grid Layout */}
        <div className="space-y-2 sm:space-y-4 lg:grid lg:grid-cols-3 lg:gap-3 xl:gap-6 lg:space-y-0">
          <div className="lg:col-span-1">
            <HabitsSection 
              habits={habits}
              archivedHabits={archivedHabits}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              onAddHabit={addHabit}
              onEditHabit={editHabit}
              onToggleHabit={toggleHabit}
              onArchiveHabit={archiveHabit}
              onRestoreHabit={restoreHabit}
              onPermanentlyDeleteHabit={permanentlyDeleteHabit}
              isLoading={isLoading}
              goals={goals}
            />
          </div>

          <div className="lg:col-span-1">
            <WeeklyOutputsSection 
              weeklyOutputs={weeklyOutputs}
              deletedWeeklyOutputs={deletedWeeklyOutputs}
              overdueWeeklyOutputs={overdueWeeklyOutputs}
              tasks={tasks}
              goals={goals}
              onAddWeeklyOutput={(output) => 
                addWeeklyOutput(output)
              }
              onEditWeeklyOutput={editWeeklyOutput}
              onUpdateProgress={updateProgress}
              onMoveWeeklyOutput={moveWeeklyOutput}
              onDeleteWeeklyOutput={deleteWeeklyOutput}
              onRestoreWeeklyOutput={restoreWeeklyOutput}
              onPermanentlyDeleteWeeklyOutput={permanentlyDeleteWeeklyOutput}
              onRefresh={loadAllData}
            />
          </div>

          <div className="lg:col-span-1">
            <TasksSection 
              tasks={tasks}
              deletedTasks={deletedTasks}
              overdueTasks={overdueTasks}
              onAddTask={addTask}
              onEditTask={editTask}
              onToggleTask={toggleTask}
              onMoveTask={handleRollOver}
              onDeleteTask={deleteTask}
              onRestoreTask={restoreTask}
              onPermanentlyDeleteTask={permanentlyDeleteTask}
              getTasksByDate={getTasksByDate}
              weeklyOutputs={weeklyOutputs}
              goals={goals}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
