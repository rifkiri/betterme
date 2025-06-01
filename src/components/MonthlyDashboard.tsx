
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Target, CheckCircle, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, isToday, isSameMonth } from 'date-fns';
import { useProductivity } from '@/hooks/useProductivity';
import { MonthlyStats } from './MonthlyStats';
import { MonthlyChart } from './MonthlyChart';
import { MonthlyHeatmap } from './MonthlyHeatmap';
import { MoodChart } from './MoodChart';

export const MonthlyDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const {
    habits,
    tasks,
    weeklyOutputs
  } = useProductivity();

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const monthDays = eachDayOfInterval({
    start: monthStart,
    end: monthEnd
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  // Calculate monthly metrics from real data
  const monthlyTasks = tasks.filter(task => task.dueDate && isSameMonth(task.dueDate, selectedMonth));
  const monthlyOutputs = weeklyOutputs.filter(output => output.dueDate && isSameMonth(output.dueDate, selectedMonth));
  const completedTasks = monthlyTasks.filter(task => task.completed).length;
  const completedOutputs = monthlyOutputs.filter(output => output.progress === 100).length;
  const averageHabitStreak = habits.length > 0 ? Math.round(habits.reduce((sum, habit) => sum + habit.streak, 0) / habits.length) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Monthly Progress</h1>
          <p className="text-gray-600">Track your monthly productivity trends and insights</p>
        </div>

        {/* Month Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button size="sm" variant="outline" onClick={() => navigateMonth('prev')} className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <span className="text-lg font-semibold">
                  {format(selectedMonth, 'MMMM yyyy')}
                </span>
                {!isSameMonth(selectedMonth, new Date()) && (
                  <Button size="sm" variant="ghost" onClick={goToCurrentMonth} className="ml-2">
                    Current Month
                  </Button>
                )}
              </div>
              
              <Button size="sm" variant="outline" onClick={() => navigateMonth('next')} className="flex items-center gap-2">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tasks Completed</p>
                  <p className="text-xl font-bold">{completedTasks}/{monthlyTasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Outputs Completed</p>
                  <p className="text-xl font-bold">{completedOutputs}/{monthlyOutputs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Habit Streak</p>
                  <p className="text-xl font-bold">{averageHabitStreak} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Days in Month</p>
                  <p className="text-xl font-bold">{monthDays.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mood Tracking */}
        <MoodChart monthDays={monthDays} selectedMonth={selectedMonth} />

        {/* Charts and Analytics */}
        <div className="grid lg:grid-cols-2 gap-6">
          <MonthlyStats tasks={monthlyTasks} outputs={monthlyOutputs} habits={habits} monthDays={monthDays} />
          
          <MonthlyChart tasks={monthlyTasks} outputs={monthlyOutputs} monthDays={monthDays} />
        </div>

        {/* Monthly Heatmap */}
        <MonthlyHeatmap tasks={monthlyTasks} outputs={monthlyOutputs} habits={habits} monthDays={monthDays} selectedMonth={selectedMonth} />
      </div>
    </div>
  );
};
