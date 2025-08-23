
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Task, WeeklyOutput } from '@/types/productivity';
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, isWithinInterval } from 'date-fns';

interface MonthlyChartProps {
  tasks: Task[];
  outputs: WeeklyOutput[];
  monthDays: Date[];
}

export const MonthlyChart = ({ tasks, outputs, monthDays }: MonthlyChartProps) => {
  // Get weeks in the month
  const monthStart = monthDays[0];
  const monthEnd = monthDays[monthDays.length - 1];
  const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 0 });

  const weeklyData = weeks.map(weekStart => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
    
    const weekTasks = tasks.filter(task => 
      task.dueDate && isWithinInterval(task.dueDate, { start: weekStart, end: weekEnd })
    );
    
    const weekOutputs = outputs.filter(output => 
      output.dueDate && isWithinInterval(output.dueDate, { start: weekStart, end: weekEnd })
    );

    const completedTasks = weekTasks.filter(task => task.completed).length;
    const completedOutputs = weekOutputs.filter(output => output.progress === 100).length;
    const avgOutputProgress = weekOutputs.length > 0 
      ? weekOutputs.reduce((sum, output) => sum + output.progress, 0) / weekOutputs.length 
      : 0;

    return {
      week: format(weekStart, 'MMM dd'),
      tasks: weekTasks.length,
      completedTasks,
      outputs: weekOutputs.length,
      completedOutputs,
      taskCompletionRate: weekTasks.length > 0 ? (completedTasks / weekTasks.length) * 100 : 0,
      outputProgress: avgOutputProgress,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Trends</CardTitle>
        <CardDescription>
          Weekly breakdown of tasks and outputs completion
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Tasks Chart */}
          <div>
            <h4 className="text-sm font-medium mb-3">Task Completion by Week</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="#e5e7eb" name="Total Tasks" />
                  <Bar dataKey="completedTasks" fill="#10b981" name="Completed Tasks" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Completion Rate Trend */}
          <div>
            <h4 className="text-sm font-medium mb-3">Completion Rate Trends (%)</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" fontSize={12} />
                  <YAxis domain={[0, 100]} fontSize={12} />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '']} />
                  <Line 
                    type="monotone" 
                    dataKey="taskCompletionRate" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Task Completion Rate"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="outputProgress" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="Output Progress"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
