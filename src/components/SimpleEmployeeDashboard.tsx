
import { useState, useMemo } from 'react';
import { Target, CheckCircle, Clock, Award, LayoutGrid, Calendar as CalendarIcon } from 'lucide-react';
import { useProductivity } from '@/hooks/useProductivity';
import { QuickStatsCard } from './QuickStatsCard';
import { FeelingTracker } from './FeelingTracker';
import { HabitsSection } from './HabitsSection';
import { useUserProfile } from '@/hooks/useUserProfile';
import { WeeklyOutputsSection } from './WeeklyOutputsSection';
import { TasksSection } from './TasksSection';
import { PageContainer, PageHeader } from '@/components/ui/standardized';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ActivitiesCalendarView, CalendarActivityItem } from './calendar/ActivitiesCalendarView';

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
    <PageContainer gradient="blue-green">
      {/* Header */}
      <PageHeader 
        title="My Productivity" 
        subtitle="Track your habits, achieve your goals, manage tasks, and plan your week" 
      />

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

      <ProductivityBody
        habits={habits}
        archivedHabits={archivedHabits}
        selectedDate={selectedDate}
        handleDateChange={handleDateChange}
        addHabit={addHabit}
        editHabit={editHabit}
        toggleHabit={toggleHabit}
        archiveHabit={archiveHabit}
        restoreHabit={restoreHabit}
        permanentlyDeleteHabit={permanentlyDeleteHabit}
        isLoading={isLoading}
        goals={goals}
        weeklyOutputs={weeklyOutputs}
        deletedWeeklyOutputs={deletedWeeklyOutputs}
        overdueWeeklyOutputs={overdueWeeklyOutputs}
        tasks={tasks}
        deletedTasks={deletedTasks}
        overdueTasks={overdueTasks}
        addWeeklyOutput={addWeeklyOutput}
        editWeeklyOutput={editWeeklyOutput}
        updateProgress={updateProgress}
        moveWeeklyOutput={moveWeeklyOutput}
        deleteWeeklyOutput={deleteWeeklyOutput}
        restoreWeeklyOutput={restoreWeeklyOutput}
        permanentlyDeleteWeeklyOutput={permanentlyDeleteWeeklyOutput}
        loadAllData={loadAllData}
        addTask={addTask}
        editTask={editTask}
        toggleTask={toggleTask}
        handleRollOver={handleRollOver}
        deleteTask={deleteTask}
        restoreTask={restoreTask}
        permanentlyDeleteTask={permanentlyDeleteTask}
        getTasksByDate={getTasksByDate}
        ownerName={profile?.name}
        ownerId={profile?.id}
      />
    </PageContainer>
  );
};

interface ProductivityBodyProps {
  habits: any[];
  archivedHabits: any[];
  selectedDate: Date;
  handleDateChange: (d: Date) => void;
  addHabit: any;
  editHabit: any;
  toggleHabit: any;
  archiveHabit: any;
  restoreHabit: any;
  permanentlyDeleteHabit: any;
  isLoading: boolean;
  goals: any[];
  weeklyOutputs: any[];
  deletedWeeklyOutputs: any[];
  overdueWeeklyOutputs: any[];
  tasks: any[];
  deletedTasks: any[];
  overdueTasks: any[];
  addWeeklyOutput: any;
  editWeeklyOutput: any;
  updateProgress: any;
  moveWeeklyOutput: any;
  deleteWeeklyOutput: any;
  restoreWeeklyOutput: any;
  permanentlyDeleteWeeklyOutput: any;
  loadAllData: any;
  addTask: any;
  editTask: any;
  toggleTask: any;
  handleRollOver: any;
  deleteTask: any;
  restoreTask: any;
  permanentlyDeleteTask: any;
  getTasksByDate: any;
  ownerName?: string;
  ownerId?: string;
}

const ProductivityBody = (props: ProductivityBodyProps) => {
  const [view, setView] = useState<'grid' | 'calendar'>('grid');

  const activities = useMemo<CalendarActivityItem[]>(() => {
    const items: CalendarActivityItem[] = [];
    props.goals.forEach((g: any) => {
      if (g.deadline) {
        items.push({
          id: g.id,
          type: 'goal',
          title: g.title,
          description: g.description,
          date: new Date(g.deadline),
          progress: g.progress ?? 0,
          ownerId: props.ownerId,
          ownerName: props.ownerName,
        });
      }
    });
    props.weeklyOutputs.forEach((o: any) => {
      if (o.dueDate) {
        items.push({
          id: o.id,
          type: 'output',
          title: o.title,
          description: o.description,
          date: new Date(o.dueDate),
          progress: o.progress ?? 0,
          ownerId: props.ownerId,
          ownerName: props.ownerName,
        });
      }
    });
    props.tasks.forEach((t: any) => {
      if (t.dueDate) {
        items.push({
          id: t.id,
          type: 'task',
          title: t.title,
          description: t.description,
          date: new Date(t.dueDate),
          priority: t.priority,
          ownerId: props.ownerId,
          ownerName: props.ownerName,
        });
      }
    });
    return items;
  }, [props.goals, props.weeklyOutputs, props.tasks, props.ownerId, props.ownerName]);

  return (
    <>
      <div className="mb-2 flex justify-end px-1 sm:px-2">
        <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as 'grid' | 'calendar')} size="sm">
          <ToggleGroupItem value="grid" aria-label="Grid view" className="gap-1">
            <LayoutGrid className="h-4 w-4" /> Grid
          </ToggleGroupItem>
          <ToggleGroupItem value="calendar" aria-label="Calendar view" className="gap-1">
            <CalendarIcon className="h-4 w-4" /> Calendar
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {view === 'calendar' ? (
        <div className="px-1 sm:px-2">
          <ActivitiesCalendarView activities={activities} title="My Activities" />
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-4 lg:grid lg:grid-cols-3 lg:gap-3 xl:gap-6 lg:space-y-0 animate-fade-in-up delay-100">
          <div className="lg:col-span-1">
            <HabitsSection
              habits={props.habits}
              archivedHabits={props.archivedHabits}
              selectedDate={props.selectedDate}
              onDateChange={props.handleDateChange}
              onAddHabit={props.addHabit}
              onEditHabit={props.editHabit}
              onToggleHabit={props.toggleHabit}
              onArchiveHabit={props.archiveHabit}
              onRestoreHabit={props.restoreHabit}
              onPermanentlyDeleteHabit={props.permanentlyDeleteHabit}
              isLoading={props.isLoading}
              goals={props.goals}
            />
          </div>
          <div className="lg:col-span-1">
            <WeeklyOutputsSection
              weeklyOutputs={props.weeklyOutputs}
              deletedWeeklyOutputs={props.deletedWeeklyOutputs}
              overdueWeeklyOutputs={props.overdueWeeklyOutputs}
              tasks={props.tasks}
              goals={props.goals}
              onAddWeeklyOutput={(output) => props.addWeeklyOutput(output)}
              onEditWeeklyOutput={props.editWeeklyOutput}
              onUpdateProgress={props.updateProgress}
              onMoveWeeklyOutput={props.moveWeeklyOutput}
              onDeleteWeeklyOutput={props.deleteWeeklyOutput}
              onRestoreWeeklyOutput={props.restoreWeeklyOutput}
              onPermanentlyDeleteWeeklyOutput={props.permanentlyDeleteWeeklyOutput}
              onRefresh={props.loadAllData}
            />
          </div>
          <div className="lg:col-span-1">
            <TasksSection
              tasks={props.tasks}
              deletedTasks={props.deletedTasks}
              overdueTasks={props.overdueTasks}
              onAddTask={props.addTask}
              onEditTask={props.editTask}
              onToggleTask={props.toggleTask}
              onMoveTask={props.handleRollOver}
              onDeleteTask={props.deleteTask}
              onRestoreTask={props.restoreTask}
              onPermanentlyDeleteTask={props.permanentlyDeleteTask}
              getTasksByDate={props.getTasksByDate}
              weeklyOutputs={props.weeklyOutputs}
              goals={props.goals}
            />
          </div>
        </div>
      )}
    </>
  );
};
