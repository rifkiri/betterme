import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Target, CheckCircle, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { useProductivity } from '@/hooks/useProductivity';
import { useMoodTracking } from '@/hooks/useMoodTracking';
import { MonthlyStats } from './MonthlyStats';
import { MonthlyChart } from './MonthlyChart';
import { MonthlyHeatmap } from './MonthlyHeatmap';
import { MoodChart } from './MoodChart';
import { 
  DashboardLayout, 
  PeriodNavigator, 
  StatCard, 
  DashboardGrid 
} from '@/components/ui/standardized';

// MonthlyDashboard component using standardized UI components
export const MonthlyDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const {
    habits,
    tasks,
    weeklyOutputs
  } = useProductivity();
  
  const { moodEntries } = useMoodTracking();

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const monthDays = eachDayOfInterval({
    start: monthStart,
    end: monthEnd
  });

  // Calculate monthly metrics from real data
  const monthlyTasks = tasks.filter(task => task.dueDate && isSameMonth(task.dueDate, selectedMonth));
  const monthlyOutputs = weeklyOutputs.filter(output => output.dueDate && isSameMonth(output.dueDate, selectedMonth));
  const completedTasks = monthlyTasks.filter(task => task.completed).length;
  const completedOutputs = monthlyOutputs.filter(output => output.progress === 100).length;
  const averageHabitStreak = habits.length > 0 ? Math.round(habits.reduce((sum, habit) => sum + habit.streak, 0) / habits.length) : 0;

  // Filter mood data for the selected month
  const monthlyMoodData = moodEntries
    .filter(entry => {
      const entryDate = new Date(entry.date);
      return isSameMonth(entryDate, selectedMonth);
    })
    .map(entry => ({
      date: new Date(entry.date),
      mood: entry.mood
    }));

  return (
    <DashboardLayout
      title="Monthly Progress"
      subtitle="Track your monthly productivity trends and insights"
      backgroundGradient="blue-green"
      maxWidth="7xl"
    >
      {/* Month Navigation */}
      <Card>
        <CardContent className="p-4">
          <PeriodNavigator
            selectedDate={selectedMonth}
            onDateChange={setSelectedMonth}
            period="month"
            showCalendar={false}
          />
        </CardContent>
      </Card>

      {/* Monthly Overview Stats */}
      <DashboardGrid columns={4} gap="md">
        <StatCard
          title="Tasks Completed"
          value={`${completedTasks}/${monthlyTasks.length}`}
          icon={CheckCircle}
          variant="info"
        />
        
        <StatCard
          title="Outputs Done"
          value={`${completedOutputs}/${monthlyOutputs.length}`}
          icon={Target}
          variant="success"
        />
        
        <StatCard
          title="Avg Habit Streak"
          value={`${averageHabitStreak} days`}
          icon={TrendingUp}
          variant="gradient"
        />
        
        <StatCard
          title="Days Active"
          value={monthDays.filter(day => isToday(day)).length > 0 ? 'Today' : '0'}
          icon={Clock}
          variant="warning"
        />
      </DashboardGrid>

      {/* Mood Tracking - Now connected to database */}
      <MoodChart monthDays={monthDays} selectedMonth={selectedMonth} moodData={monthlyMoodData} />

      {/* Charts and Analytics */}
      <DashboardGrid columns={2} gap="md">
        <MonthlyStats tasks={monthlyTasks} outputs={monthlyOutputs} habits={habits} monthDays={monthDays} />
        <MonthlyChart tasks={monthlyTasks} outputs={monthlyOutputs} monthDays={monthDays} />
      </DashboardGrid>

      {/* Monthly Heatmap */}
      <MonthlyHeatmap tasks={monthlyTasks} outputs={monthlyOutputs} habits={habits} monthDays={monthDays} selectedMonth={selectedMonth} />
    </DashboardLayout>
  );
};