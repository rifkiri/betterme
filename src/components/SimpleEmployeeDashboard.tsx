
import { Target, CheckCircle, Clock, Award } from 'lucide-react';
import { useProductivity } from '@/hooks/useProductivity';
import { QuickStatsCard } from './QuickStatsCard';
import { HabitsSection } from './HabitsSection';
import { WeeklyOutputsSection } from './WeeklyOutputsSection';
import { TasksSection } from './TasksSection';

export const SimpleEmployeeDashboard = () => {
  console.log('SimpleEmployeeDashboard rendering...');
  
  const {
    habits,
    archivedHabits,
    tasks,
    deletedTasks,
    weeklyOutputs,
    deletedWeeklyOutputs,
    addHabit,
    addTask,
    addWeeklyOutput,
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
    deleteWeeklyOutput,
    restoreWeeklyOutput,
    permanentlyDeleteWeeklyOutput,
  } = useProductivity();

  console.log('Dashboard data:', {
    habitsCount: habits.length,
    tasksCount: tasks.length,
    weeklyOutputsCount: weeklyOutputs.length
  });

  const completedHabits = habits.filter(habit => habit.completed).length;
  const todaysTasks = getTodaysTasks();
  const overdueTasks = getOverdueTasks();
  
  console.log('Today tasks:', todaysTasks.length, 'Overdue tasks:', overdueTasks.length);
  
  const handleRollOver = (taskId: string, targetDate: Date) => {
    rollOverTask(taskId, targetDate);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Productivity Dashboard</h1>
          <p className="text-gray-600">Track your habits, manage tasks, and plan your week</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <QuickStatsCard
            title="Habits Today"
            value={`${completedHabits}/${habits.length}`}
            icon={Target}
            gradient="bg-gradient-to-r from-blue-50 to-blue-100"
          />
          <QuickStatsCard
            title="Today's Tasks"
            value={`${todaysTasks.filter(t => t.completed).length}/${todaysTasks.length}`}
            icon={CheckCircle}
            gradient="bg-gradient-to-r from-green-50 to-green-100"
          />
          <QuickStatsCard
            title="Overdue"
            value={overdueTasks.length.toString()}
            icon={Clock}
            gradient="bg-gradient-to-r from-orange-50 to-orange-100"
          />
          <QuickStatsCard
            title="Best Streak"
            value={Math.max(...habits.map(h => h.streak), 0).toString()}
            icon={Award}
            gradient="bg-gradient-to-r from-purple-50 to-purple-100"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <HabitsSection 
            habits={habits}
            archivedHabits={archivedHabits}
            onAddHabit={addHabit}
            onToggleHabit={toggleHabit}
            onArchiveHabit={archiveHabit}
            onRestoreHabit={restoreHabit}
            onPermanentlyDeleteHabit={permanentlyDeleteHabit}
          />

          <WeeklyOutputsSection
            weeklyOutputs={weeklyOutputs}
            deletedWeeklyOutputs={deletedWeeklyOutputs}
            onAddWeeklyOutput={addWeeklyOutput}
            onUpdateProgress={updateProgress}
            onDeleteWeeklyOutput={deleteWeeklyOutput}
            onRestoreWeeklyOutput={restoreWeeklyOutput}
            onPermanentlyDeleteWeeklyOutput={permanentlyDeleteWeeklyOutput}
          />

          <TasksSection
            tasks={tasks}
            deletedTasks={deletedTasks}
            overdueTasks={overdueTasks}
            onAddTask={addTask}
            onToggleTask={toggleTask}
            onMoveTask={handleRollOver}
            onDeleteTask={deleteTask}
            onRestoreTask={restoreTask}
            onPermanentlyDeleteTask={permanentlyDeleteTask}
            getTasksByDate={getTasksByDate}
            weeklyOutputs={weeklyOutputs}
          />
        </div>
      </div>
    </div>
  );
};
