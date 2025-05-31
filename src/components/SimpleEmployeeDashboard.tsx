
import { Target, CheckCircle, Clock, Award } from 'lucide-react';
import { useProductivity } from '@/hooks/useProductivity';
import { QuickStatsCard } from './QuickStatsCard';
import { HabitsSection } from './HabitsSection';
import { WeeklyOutputsSection } from './WeeklyOutputsSection';
import { TasksSection } from './TasksSection';

export const SimpleEmployeeDashboard = () => {
  const {
    habits,
    tasks,
    addHabit,
    addTask,
    toggleHabit,
    toggleTask,
    rollOverTask,
    getTodaysTasks,
    getOverdueTasks,
    getTasksByDate,
  } = useProductivity();

  const completedHabits = habits.filter(habit => habit.completed).length;
  const todaysTasks = getTodaysTasks();
  const overdueTasks = getOverdueTasks();
  
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
            onAddHabit={addHabit}
            onToggleHabit={toggleHabit}
          />

          <WeeklyOutputsSection />

          <TasksSection
            tasks={tasks}
            overdueTasks={overdueTasks}
            onAddTask={addTask}
            onToggleTask={toggleTask}
            onMoveTask={handleRollOver}
            getTasksByDate={getTasksByDate}
          />
        </div>
      </div>
    </div>
  );
};
