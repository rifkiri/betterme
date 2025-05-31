
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Clock, Calendar as CalendarIcon, ArrowRight, Target, Plus, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, isToday, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { useProductivity } from '@/hooks/useProductivity';
import { AddHabitDialog } from './AddHabitDialog';
import { AddTaskDialog } from './AddTaskDialog';
import { MoveTaskDialog } from './MoveTaskDialog';
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
  const [selectedTaskDate, setSelectedTaskDate] = useState(new Date());
  
  // Weekly outputs with progress tracking
  const [weeklyOutputs, setWeeklyOutputs] = useState([
    { id: '1', title: "Complete Q4 project proposal and presentation", progress: 75 },
    { id: '2', title: "Finish client onboarding documentation", progress: 40 },
    { id: '3', title: "Conduct 3 team performance reviews", progress: 100 },
    { id: '4', title: "Launch marketing campaign for new product feature", progress: 20 }
  ]);
  
  const today = new Date();
  const weekStart = addWeeks(startOfWeek(today, {
    weekStartsOn: 1
  }), selectedWeekOffset);
  const weekDays = Array.from({
    length: 7
  }, (_, i) => addDays(weekStart, i));
  
  const completedHabits = habits.filter(habit => habit.completed).length;
  const todaysTasks = getTodaysTasks();
  const overdueTasks = getOverdueTasks();
  const selectedDateTasks = getTasksByDate(selectedTaskDate);
  
  const handleRollOver = (taskId: string, targetDate: Date) => {
    rollOverTask(taskId, targetDate);
  };
  
  const getTasksForDay = (date: Date) => {
    return getTasksByDate(date);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedTaskDate(prev => addDays(prev, direction === 'next' ? 1 : -1));
  };

  const goToToday = () => {
    setSelectedTaskDate(new Date());
  };

  const updateProgress = (outputId: string, newProgress: number) => {
    setWeeklyOutputs(prev => prev.map(output => 
      output.id === outputId ? { ...output, progress: Math.max(0, Math.min(100, newProgress)) } : output
    ));
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  const TaskItem = ({
    task,
    targetDate
  }: {
    task: Task;
    targetDate?: Date;
  }) => <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3 flex-1">
        <button onClick={() => toggleTask(task.id)}>
          {task.completed ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-gray-400" />}
        </button>
        <div className="flex-1">
          <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
            {task.title}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'default' : 'secondary'} className="text-xs">
              {task.priority}
            </Badge>
            {task.estimatedTime && <span className="text-xs text-gray-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {task.estimatedTime}
              </span>}
          </div>
        </div>
      </div>
      {!task.completed && (
        <MoveTaskDialog 
          onMoveTask={(newDate) => handleRollOver(task.id, newDate)}
        />
      )}
    </div>;

  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
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
              {habits.map(habit => <div key={habit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <button onClick={() => toggleHabit(habit.id)}>
                      {habit.completed ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-gray-400" />}
                    </button>
                    <div>
                      <span className={`font-medium ${habit.completed ? 'text-green-700' : 'text-gray-700'}`}>
                        {habit.name}
                      </span>
                      {habit.category && <p className="text-xs text-gray-500">{habit.category}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={habit.streak > 0 ? 'default' : 'secondary'} className="text-xs">
                      {habit.streak} day streak
                    </Badge>
                  </div>
                </div>)}
            </CardContent>
          </Card>

          {/* Weekly Plan */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  This Week's Outputs
                </CardTitle>
                <CardDescription>Key deliverables and goals for the week</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyOutputs.map((output) => (
                  <div key={output.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-sm text-gray-700 leading-relaxed flex-1">{output.title}</p>
                      <Badge 
                        variant={output.progress === 100 ? 'default' : 'secondary'} 
                        className="ml-2 text-xs"
                      >
                        {output.progress}%
                      </Badge>
                    </div>
                    
                    <div className="mb-3">
                      <Progress 
                        value={output.progress} 
                        className="h-2"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateProgress(output.id, output.progress - 10)}
                        disabled={output.progress <= 0}
                        className="text-xs px-2 py-1"
                      >
                        -10%
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateProgress(output.id, output.progress + 10)}
                        disabled={output.progress >= 100}
                        className="text-xs px-2 py-1"
                      >
                        +10%
                      </Button>
                      {output.progress !== 100 && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => updateProgress(output.id, 100)}
                          className="text-xs px-2 py-1"
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button size="sm" variant="outline" className="w-full mt-3">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Weekly Output
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tasks with Date Navigation */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>
                  {isToday(selectedTaskDate) ? 'Today' : format(selectedTaskDate, 'MMM dd, yyyy')}
                </CardDescription>
              </div>
              <AddTaskDialog onAddTask={(task) => addTask({ ...task, dueDate: selectedTaskDate })} />
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Date Navigation */}
              <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigateDate('prev')}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    {format(selectedTaskDate, 'EEE, MMM dd')}
                  </span>
                  {!isToday(selectedTaskDate) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={goToToday}
                      className="text-xs"
                    >
                      Today
                    </Button>
                  )}
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigateDate('next')}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Tasks for Selected Date */}
              {selectedDateTasks.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No tasks for this date</p>
              ) : (
                selectedDateTasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    targetDate={addDays(selectedTaskDate, 1)} 
                  />
                ))
              )}
              
              {/* Show overdue tasks only when viewing today */}
              {isToday(selectedTaskDate) && overdueTasks.length > 0 && (
                <>
                  <div className="border-t pt-3 mt-3">
                    <h4 className="text-sm font-medium text-orange-600 mb-2">Overdue Tasks</h4>
                    {overdueTasks.slice(0, 3).map(task => (
                      <TaskItem key={task.id} task={task} targetDate={today} />
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
