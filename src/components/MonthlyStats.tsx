
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Task, WeeklyOutput, Habit } from '@/types/productivity';

interface MonthlyStatsProps {
  tasks: Task[];
  outputs: WeeklyOutput[];
  habits: Habit[];
  monthDays: Date[];
}

export const MonthlyStats = ({ tasks, outputs, habits, monthDays }: MonthlyStatsProps) => {
  const completedTasks = tasks.filter(task => task.completed);
  const completedOutputs = outputs.filter(output => output.progress === 100);
  
  const taskCompletionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
  const outputCompletionRate = outputs.length > 0 ? (completedOutputs.length / outputs.length) * 100 : 0;
  
  const highPriorityTasks = tasks.filter(task => task.priority === 'High');
  const highPriorityCompleted = highPriorityTasks.filter(task => task.completed).length;
  const highPriorityRate = highPriorityTasks.length > 0 ? (highPriorityCompleted / highPriorityTasks.length) * 100 : 0;

  const averageOutputProgress = outputs.length > 0 
    ? outputs.reduce((sum, output) => sum + output.progress, 0) / outputs.length 
    : 0;

  const bestHabitStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  const completedHabitsToday = habits.filter(habit => habit.completed).length;
  const habitCompletionRate = habits.length > 0 ? (completedHabitsToday / habits.length) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Monthly Performance</span>
        </CardTitle>
        <CardDescription>
          Detailed breakdown of your productivity metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Task Statistics */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Task Performance</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Completion Rate</span>
              <span className="font-medium">{taskCompletionRate.toFixed(1)}%</span>
            </div>
            <Progress value={taskCompletionRate} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>High Priority Tasks</span>
              <span className="font-medium">{highPriorityRate.toFixed(1)}%</span>
            </div>
            <Progress value={highPriorityRate} className="h-2" />
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total Tasks</span>
            <span>{tasks.length}</span>
          </div>
        </div>

        {/* Output Statistics */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Bi-Weekly Outputs</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completion Rate</span>
              <span className="font-medium">{outputCompletionRate.toFixed(1)}%</span>
            </div>
            <Progress value={outputCompletionRate} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Average Progress</span>
              <span className="font-medium">{averageOutputProgress.toFixed(1)}%</span>
            </div>
            <Progress value={averageOutputProgress} className="h-2" />
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total Outputs</span>
            <span>{outputs.length}</span>
          </div>
        </div>

        {/* Habit Statistics */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Habit Tracking</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Today's Completion</span>
              <span className="font-medium">{habitCompletionRate.toFixed(1)}%</span>
            </div>
            <Progress value={habitCompletionRate} className="h-2" />
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>Best Streak</span>
            <span>{bestHabitStreak} days</span>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>Active Habits</span>
            <span>{habits.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
