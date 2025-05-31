
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Calendar as CalendarIcon,
  ArrowRight,
  Target,
  Plus,
  Award
} from 'lucide-react';
import { format, addDays, isToday, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { useProductivity } from '@/hooks/useProductivity';
import { AddHabitDialog } from './AddHabitDialog';
import { AddTaskDialog } from './AddTaskDialog';
import { Task } from '@/types/productivity';

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
    createWeeklyPlan
  } = useProductivity();

  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  
  const today = new Date();
  const weekStart = addWeeks(startOfWeek(today, { weekStartsOn: 1 }), selectedWeekOffset);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const completedHabits = habits.filter(habit => habit.completed).length;
  const todaysTasks = getTodaysTasks();
  const overdueTasks = getOverdueTasks();

  const handleRollOver = (taskId: string, targetDate: Date) => {
    rollOverTask(taskId, targetDate);
  };

  const getTasksForDay = (date: Date) => {
    return getTasksByDate(date);
  };

  const TaskItem = ({ task, targetDate }: { task: Task; targetDate?: Date }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3 flex-1">
        <button onClick={() => toggleTask(task.id)}>
          {task.completed ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-gray-400" />
          )}
        </button>
        <div className="flex-1">
          <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
            {task.title}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'default' : 'secondary'} className="text-xs">
              {task.priority}
            </Badge>
            {task.estimatedTime && (
              <span className="text-xs text-gray-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {task.estimatedTime}
              </span>
            )}
          </div>
        </div>
      </div>
      {targetDate && !task.completed && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleRollOver(task.id, targetDate)}
          className="flex items-center gap-1 text-xs"
        >
          <ArrowRight className="h-3 w-3" />
          Move
        </Button>
      )}
    </div>
  );

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
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Habits Today</p>
                  <p className="text-2xl font-bold text-blue-800">{completedHabits}/{habits.length}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Today's Tasks</p>
                  <p className="text-2xl font-bold text-green-800">{todaysTasks.filter(t => t.completed).length}/{todaysTasks.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Overdue</p>
                  <p className="text-2xl font-bold text-orange-800">{overdueTasks.length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Best Streak</p>
                  <p className="text-2xl font-bold text-purple-800">{Math.max(...habits.map(h => h.streak), 0)}</p>
                </div>
                <Award className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Habits */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Daily Habits</CardTitle>
                <CardDescription>Build your streaks</CardDescription>
              </div>
              <AddHabitDialog onAddHabit={addHabit} />
            </CardHeader>
            <CardContent className="space-y-3">
              {habits.map((habit) => (
                <div key={habit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <button onClick={() => toggleHabit(habit.id)}>
                      {habit.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    <div>
                      <span className={`font-medium ${habit.completed ? 'text-green-700' : 'text-gray-700'}`}>
                        {habit.name}
                      </span>
                      {habit.category && (
                        <p className="text-xs text-gray-500">{habit.category}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={habit.streak > 0 ? 'default' : 'secondary'} className="text-xs">
                      {habit.streak} day streak
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Today's Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Today's Tasks</CardTitle>
                <CardDescription>Focus on what matters</CardDescription>
              </div>
              <AddTaskDialog onAddTask={addTask} />
            </CardHeader>
            <CardContent className="space-y-3">
              {todaysTasks.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No tasks for today</p>
              ) : (
                todaysTasks.map((task) => (
                  <TaskItem key={task.id} task={task} targetDate={addDays(today, 1)} />
                ))
              )}
              
              {overdueTasks.length > 0 && (
                <>
                  <div className="border-t pt-3 mt-3">
                    <h4 className="text-sm font-medium text-orange-600 mb-2">Overdue Tasks</h4>
                    {overdueTasks.slice(0, 3).map((task) => (
                      <TaskItem key={task.id} task={task} targetDate={today} />
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Weekly Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Weekly Overview</CardTitle>
                  <CardDescription>
                    {format(weekStart, 'MMM dd')} - {format(addDays(weekStart, 6), 'MMM dd, yyyy')}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedWeekOffset(selectedWeekOffset - 1)}
                  >
                    ←
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedWeekOffset(selectedWeekOffset + 1)}
                  >
                    →
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {weekDays.map((day, index) => {
                  const dayTasks = getTasksForDay(day);
                  const isCurrentDay = isToday(day);
                  const completedCount = dayTasks.filter(t => t.completed).length;
                  
                  return (
                    <div 
                      key={index} 
                      className={`p-3 border rounded-lg ${isCurrentDay ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-medium text-sm ${isCurrentDay ? 'text-blue-700' : 'text-gray-700'}`}>
                          {format(day, 'EEE dd')}
                          {isCurrentDay && <span className="ml-1 text-xs">(Today)</span>}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {completedCount}/{dayTasks.length}
                        </span>
                      </div>
                      
                      {dayTasks.length > 0 && (
                        <Progress 
                          value={dayTasks.length > 0 ? (completedCount / dayTasks.length) * 100 : 0} 
                          className="h-2 mb-2"
                        />
                      )}
                      
                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map(task => (
                          <div key={task.id} className="flex items-center space-x-2">
                            {task.completed ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <Circle className="h-3 w-3 text-gray-400" />
                            )}
                            <span className={`text-xs ${task.completed ? 'line-through text-gray-500' : ''}`}>
                              {task.title.length > 25 ? `${task.title.slice(0, 25)}...` : task.title}
                            </span>
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <span className="text-xs text-gray-400">+{dayTasks.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
