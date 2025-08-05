
import { Target, CheckCircle, Clock, Award, Calendar } from 'lucide-react';
import { useProductivity } from '@/hooks/useProductivity';
import { QuickStatsCard } from './QuickStatsCard';
import { FeelingTracker } from './FeelingTracker';
import { HabitsSection } from './HabitsSection';
import { GoalsSection } from './GoalsSection';
import { WeeklyOutputsSection } from './WeeklyOutputsSection';
import { TasksSection } from './TasksSection';
import { Goal } from '@/types/productivity';

export const SimpleEmployeeDashboard = () => {
  console.log('SimpleEmployeeDashboard rendering...');
  
  const {
    habits,
    archivedHabits,
    tasks,
    deletedTasks,
    weeklyOutputs,
    deletedWeeklyOutputs,
    goals,
    deletedGoals,
    selectedDate,
    handleDateChange,
    addHabit,
    editHabit,
    addTask,
    editTask,
    addWeeklyOutput,
    editWeeklyOutput,
    addGoal,
    editGoal,
    updateGoalProgress,
    moveGoal,
    deleteGoal,
    restoreGoal,
    permanentlyDeleteGoal,
    getOverdueGoals,
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
    getOverdueWeeklyOutputs
  } = useProductivity();

  const overdueGoals = getOverdueGoals();

  console.log('Dashboard data:', {
    habitsCount: habits.length,
    tasksCount: tasks.length,
    weeklyOutputsCount: weeklyOutputs.length,
    goalsCount: goals.length
  });

  const completedHabits = habits.filter(habit => habit.completed).length;
  const completedGoals = goals.filter(goal => goal.completed).length;
  const todaysTasks = getTodaysTasks();
  const overdueTasks = getOverdueTasks();
  const overdueWeeklyOutputs = getOverdueWeeklyOutputs();

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

        {/* Quick Stats - Updated to include goals */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-1 sm:gap-2 lg:gap-4 mb-2 sm:mb-4 px-1 sm:px-2">
          <QuickStatsCard 
            title="Habits Today" 
            value={`${completedHabits}/${habits.length}`} 
            icon={Target} 
            gradient="bg-gradient-to-r from-blue-50 to-blue-100" 
          />
          <QuickStatsCard 
            title="Goals Progress" 
            value={`${completedGoals}/${goals.length}`} 
            icon={Award} 
            gradient="bg-gradient-to-r from-indigo-50 to-indigo-100" 
          />
          <QuickStatsCard 
            title="Best Streak" 
            value={Math.max(...habits.map(h => h.streak), 0).toString()} 
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

        {/* Mobile-first responsive grid - Updated to 4 columns to include Goals */}
        <div className="space-y-2 sm:space-y-4 lg:grid lg:grid-cols-4 lg:gap-3 xl:gap-6 lg:space-y-0">
          <div className="lg:col-span-1 space-y-2 sm:space-y-4">
            <FeelingTracker />
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
            />
          </div>

          {/* New Goals Section */}
          <div className="lg:col-span-1">
            <GoalsSection 
              goals={goals}
              deletedGoals={deletedGoals}
              overdueGoals={overdueGoals}
              tasks={tasks}
              weeklyOutputs={weeklyOutputs}
              onAddGoal={addGoal}
              onEditGoal={editGoal}
              onUpdateProgress={updateGoalProgress}
              onMoveGoal={moveGoal}
              onDeleteGoal={deleteGoal}
              onRestoreGoal={restoreGoal}
              onPermanentlyDeleteGoal={permanentlyDeleteGoal}
            />
          </div>

          <div className="lg:col-span-1">
            <WeeklyOutputsSection 
              weeklyOutputs={weeklyOutputs}
              deletedWeeklyOutputs={deletedWeeklyOutputs}
              overdueWeeklyOutputs={overdueWeeklyOutputs}
              tasks={tasks}
              goals={goals}
              onAddWeeklyOutput={addWeeklyOutput}
              onEditWeeklyOutput={editWeeklyOutput}
              onUpdateProgress={updateProgress}
              onMoveWeeklyOutput={moveWeeklyOutput}
              onDeleteWeeklyOutput={deleteWeeklyOutput}
              onRestoreWeeklyOutput={restoreWeeklyOutput}
              onPermanentlyDeleteWeeklyOutput={permanentlyDeleteWeeklyOutput}
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
