
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addDays } from 'date-fns';
import { Task, WeeklyOutput } from '@/types/productivity';
import { TodayTasksTab } from './TodayTasksTab';
import { OverdueTasksTab } from './OverdueTasksTab';
import { CompletedTasksTab } from './CompletedTasksTab';
import { CalendarTasksTab } from './CalendarTasksTab';

interface TaskPlanningProps {
  tasks: Task[];
  weeklyOutputs: WeeklyOutput[];
  onToggleTask: (id: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'createdDate'>) => void;
  onRollOverTask: (taskId: string, newDueDate: Date) => void;
  getTodaysTasks: () => Task[];
  getOverdueTasks: () => Task[];
  getCompletedTasks: () => Task[];
  getTasksByDate: (date: Date) => Task[];
}

export const TaskPlanning = ({
  tasks,
  weeklyOutputs,
  onToggleTask,
  onAddTask,
  onRollOverTask,
  getTodaysTasks,
  getOverdueTasks,
  getCompletedTasks,
  getTasksByDate
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
          <TodayTasksTab
            tasks={todaysTasks}
            weeklyOutputs={weeklyOutputs}
            onToggleTask={onToggleTask}
            onAddTask={onAddTask}
            onRollOverTask={handleRollOver}
          />
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <OverdueTasksTab
            tasks={overdueTasks}
            onToggleTask={onToggleTask}
            onRollOverTask={handleRollOver}
          />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <CompletedTasksTab
            tasks={completedTasks}
            onToggleTask={onToggleTask}
          />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <CalendarTasksTab
            selectedDate={selectedDate}
            tasks={selectedDateTasks}
            weeklyOutputs={weeklyOutputs}
            onSelectDate={setSelectedDate}
            onToggleTask={onToggleTask}
            onAddTask={onAddTask}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
