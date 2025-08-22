
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Calendar as CalendarIcon,
  ArrowRight,
  AlertTriangle,
  Target,
  Plus
} from 'lucide-react';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { Task, WeeklyOutput } from '@/types/productivity';
import { AddTaskDialog } from './AddTaskDialog';

interface TaskPlanningProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'createdDate' | 'isMoved'>) => void;
  onRollOverTask: (taskId: string, newDueDate: Date) => void;
  getTodaysTasks: () => Task[];
  getOverdueTasks: () => Task[];
  getCompletedTasks: () => Task[];
  getTasksByDate: (date: Date) => Task[];
  weeklyOutputs: WeeklyOutput[];
}

export const TaskPlanning = ({
  tasks,
  onToggleTask,
  onAddTask,
  onRollOverTask,
  getTodaysTasks,
  getOverdueTasks,
  getCompletedTasks,
  getTasksByDate,
  weeklyOutputs
}: TaskPlanningProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('today');

  const todaysTasks = getTodaysTasks();
  const overdueTasks = getOverdueTasks();
  const completedTasks = getCompletedTasks();
  const selectedDateTasks = getTasksByDate(selectedDate);

  const handleRollOver = (taskId: string) => {
    const tomorrow = addDays(new Date(), 1);
    onRollOverTask(taskId, tomorrow);
  };

  const TaskItem = ({ task, showRollOver = false }: { task: Task; showRollOver?: boolean }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3">
        <button onClick={() => onToggleTask(task.id)}>
          {task.completed ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-gray-400" />
          )}
        </button>
        <div>
          <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
            {task.title}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant={task.priority === 'high' || task.priority === 'urgent' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
              {task.priority}
            </Badge>
            {task.estimatedTime && (
              <span className="text-sm text-gray-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {task.estimatedTime}
              </span>
            )}
            {task.dueDate && (
              <span className="text-sm text-gray-500 flex items-center">
                <CalendarIcon className="h-3 w-3 mr-1" />
                {isToday(task.dueDate) ? 'Today' : isTomorrow(task.dueDate) ? 'Tomorrow' : format(task.dueDate, 'MMM dd')}
              </span>
            )}
          </div>
        </div>
      </div>
      {showRollOver && !task.completed && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleRollOver(task.id)}
          className="flex items-center gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          Roll to Tomorrow
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Today's Tasks</CardTitle>
                <CardDescription>
                  {todaysTasks.filter(t => t.completed).length} of {todaysTasks.length} completed
                </CardDescription>
              </div>
              <AddTaskDialog onAddTask={onAddTask} weeklyOutputs={weeklyOutputs} />
            </CardHeader>
            <CardContent className="space-y-4">
              {todaysTasks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No tasks for today</p>
              ) : (
                todaysTasks.map((task) => (
                  <TaskItem key={task.id} task={task} showRollOver={true} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Overdue Tasks
              </CardTitle>
              <CardDescription>
                {overdueTasks.length} tasks need attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {overdueTasks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Great! No overdue tasks</p>
              ) : (
                overdueTasks.map((task) => (
                  <TaskItem key={task.id} task={task} showRollOver={true} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Completed Tasks
              </CardTitle>
              <CardDescription>
                {completedTasks.length} tasks completed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {completedTasks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No completed tasks yet</p>
              ) : (
                completedTasks.slice(0, 10).map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
                <CardDescription>Choose a date to view or plan tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>
                    Tasks for {format(selectedDate, 'MMMM dd, yyyy')}
                  </CardTitle>
                  <CardDescription>
                    {selectedDateTasks.filter(t => t.completed).length} of {selectedDateTasks.length} completed
                  </CardDescription>
                </div>
                <AddTaskDialog 
                  onAddTask={(task) => onAddTask({ ...task, dueDate: selectedDate, originalDueDate: selectedDate })} 
                  weeklyOutputs={weeklyOutputs}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedDateTasks.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No tasks for this date</p>
                ) : (
                  selectedDateTasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
