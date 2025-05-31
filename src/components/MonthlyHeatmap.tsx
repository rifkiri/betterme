
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Task, WeeklyOutput, Habit } from '@/types/productivity';
import { format, isSameDay, getDay, startOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

interface MonthlyHeatmapProps {
  tasks: Task[];
  outputs: WeeklyOutput[];
  habits: Habit[];
  monthDays: Date[];
  selectedMonth: Date;
}

export const MonthlyHeatmap = ({ tasks, outputs, habits, monthDays, selectedMonth }: MonthlyHeatmapProps) => {
  const getActivityLevel = (date: Date) => {
    const dayTasks = tasks.filter(task => task.dueDate && isSameDay(task.dueDate, date));
    const dayOutputs = outputs.filter(output => output.dueDate && isSameDay(output.dueDate, date));
    
    const completedTasks = dayTasks.filter(task => task.completed).length;
    const totalTasks = dayTasks.length;
    
    const totalActivity = totalTasks + dayOutputs.length;
    const completedActivity = completedTasks + dayOutputs.filter(output => output.progress === 100).length;
    
    if (totalActivity === 0) return 0;
    
    const completionRate = completedActivity / totalActivity;
    
    if (completionRate >= 0.8) return 4; // High activity
    if (completionRate >= 0.6) return 3; // Medium-high activity
    if (completionRate >= 0.4) return 2; // Medium activity
    if (completionRate > 0) return 1; // Low activity
    return 0; // No activity
  };

  const getActivityColor = (level: number) => {
    switch (level) {
      case 4: return 'bg-green-600';
      case 3: return 'bg-green-400';
      case 2: return 'bg-green-200';
      case 1: return 'bg-green-100';
      default: return 'bg-gray-100';
    }
  };

  const getActivityLabel = (level: number) => {
    switch (level) {
      case 4: return 'High productivity';
      case 3: return 'Good productivity';
      case 2: return 'Moderate productivity';
      case 1: return 'Low productivity';
      default: return 'No activity';
    }
  };

  // Prepare calendar grid
  const firstDayOfMonth = startOfMonth(selectedMonth);
  const startingDayOfWeek = getDay(firstDayOfMonth);
  const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1; // Monday = 0

  const calendarDays = [];
  
  // Add empty cells for days before the month starts
  for (let i = 0; i < adjustedStartingDay; i++) {
    calendarDays.push(null);
  }
  
  // Add all days of the month
  monthDays.forEach(day => {
    calendarDays.push(day);
  });

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Activity Heatmap</CardTitle>
        <CardDescription>
          Daily productivity visualization - darker colors indicate higher completion rates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Weekday headers */}
            {weekdays.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={index} className="w-8 h-8" />;
              }
              
              const activityLevel = getActivityLevel(day);
              const dayTasks = tasks.filter(task => task.dueDate && isSameDay(task.dueDate, day));
              const dayOutputs = outputs.filter(output => output.dueDate && isSameDay(output.dueDate, day));
              
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "w-8 h-8 rounded-sm flex items-center justify-center text-xs font-medium border border-gray-200 cursor-pointer transition-all hover:ring-2 hover:ring-blue-300",
                    getActivityColor(activityLevel),
                    activityLevel >= 2 ? 'text-white' : 'text-gray-700'
                  )}
                  title={`${format(day, 'MMM dd')}: ${getActivityLabel(activityLevel)} (${dayTasks.length} tasks, ${dayOutputs.length} outputs)`}
                >
                  {format(day, 'd')}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Less</span>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={cn(
                    "w-3 h-3 rounded-sm border border-gray-200",
                    getActivityColor(level)
                  )}
                  title={getActivityLabel(level)}
                />
              ))}
            </div>
            <span>More</span>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-lg font-semibold text-green-600">
                {monthDays.filter(day => getActivityLevel(day) >= 3).length}
              </p>
              <p className="text-xs text-gray-600">High Productivity Days</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-blue-600">
                {monthDays.filter(day => getActivityLevel(day) >= 1).length}
              </p>
              <p className="text-xs text-gray-600">Active Days</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-600">
                {((monthDays.filter(day => getActivityLevel(day) >= 1).length / monthDays.length) * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-gray-600">Activity Rate</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
