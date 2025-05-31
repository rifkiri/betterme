
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Task, WeeklyOutput } from '@/types/productivity';
import { AddTaskDialog } from './AddTaskDialog';
import { TaskPlanningItem } from './TaskPlanningItem';
import { TaskStats } from './TaskStats';

interface CalendarTasksTabProps {
  selectedDate: Date;
  tasks: Task[];
  weeklyOutputs: WeeklyOutput[];
  onSelectDate: (date: Date) => void;
  onToggleTask: (id: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'createdDate'>) => void;
}

export const CalendarTasksTab = ({
  selectedDate,
  tasks,
  weeklyOutputs,
  onSelectDate,
  onToggleTask,
  onAddTask
}: CalendarTasksTabProps) => {
  return (
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
            onSelect={(date) => date && onSelectDate(date)}
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
              <TaskStats 
                completedCount={tasks.filter(t => t.completed).length} 
                totalCount={tasks.length} 
              />
            </CardDescription>
          </div>
          <AddTaskDialog 
            onAddTask={onAddTask}
            weeklyOutputs={weeklyOutputs}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No tasks for this date</p>
          ) : (
            tasks.map((task) => (
              <TaskPlanningItem 
                key={task.id} 
                task={task}
                onToggleTask={onToggleTask}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
