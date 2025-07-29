
import { Target, CheckCircle, Clock, Award, Calendar } from 'lucide-react';
import { useProductivity } from '@/hooks/useProductivity';
import { QuickStatsCard } from './QuickStatsCard';
import { FeelingTracker } from './FeelingTracker';
import { HabitsSection } from './HabitsSection';
import { GoalsSection, Goal } from './GoalsSection';
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
    getOverdueWeeklyOutputs
  } = useProductivity();

  // Mock goals data - you'll need to add this to your useProductivity hook
  // or create a separate useGoals hook
  const goals: Goal[] = [
    {
      id: '1',
      title: 'Complete 25 Tasks This Week',
      description: 'Focus on productivity and task completion',
      targetValue: 25,
      currentValue: 18,
      unit: 'tasks',
      category: 'weekly',
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      createdAt: new Date(),
      completed: false,
      archived: false
    },
    {
      id: '2',
      title: 'Maintain 7-Day Habit Streak',
      description: 'Keep all habits consistent for a week',
      targetValue: 7,
      currentValue: 5,
      unit: 'days',
      category: 'daily',
      createdAt: new Date(),
      completed: false,
      archived: false
    }
  ];

  // Mock goal handlers - you'll need to implement these in your data layer
  const handleAddGoal = (goal: Omit<Goal, 'id' | 'createdAt' | 'completed' | 'archived'>) => {
    console.log('Adding goal:', goal);
    // Implementation needed: Add to your state management
  };

  const handleEditGoal = (id: string, updates: Partial<Goal>) => {
    console.log('Editing goal:', id, updates);
    // Implementation needed: Update in your state management
  };

  const handleDeleteGoal = (id: string) => {
    console.log('Deleting goal:', id);
    // Implementation needed: Delete from your state management
  };

  const handleUpdateGoalProgress = (id: string, newValue: number) => {
    console.log('Updating goal progress:', id, newValue);
    // Implementation needed: Update progress in your state management
  };

  const handleToggleGoalComplete = (id: string) => {
    console.log('Toggling goal completion:', id);
    // Implementation needed: Mark goal as complete in your state management
  };

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
              onAddGoal={handleAddGoal}
              onEditGoal={handleEditGoal}
              onDeleteGoal={handleDeleteGoal}
              onUpdateProgress={handleUpdateGoalProgress}
              onToggleComplete={handleToggleGoalComplete}
            />
          </div>

          <div className="lg:col-span-1">
            <WeeklyOutputsSection 
              weeklyOutputs={weeklyOutputs}
              deletedWeeklyOutputs={deletedWeeklyOutputs}
              overdueWeeklyOutputs={overdueWeeklyOutputs}
              tasks={tasks}
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
            />
          </div>
        </div>
      </div>
    </div>
  );
};
