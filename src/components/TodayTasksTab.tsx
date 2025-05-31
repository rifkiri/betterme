
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Task, WeeklyOutput } from '@/types/productivity';
import { AddTaskDialog } from './AddTaskDialog';
import { TaskPlanningItem } from './TaskPlanningItem';
import { TaskStats } from './TaskStats';

interface TodayTasksTabProps {
  tasks: Task[];
  weeklyOutputs: WeeklyOutput[];
  onToggleTask: (id: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'createdDate'>) => void;
  onRollOverTask: (taskId: string) => void;
}

export const TodayTasksTab = ({
  tasks,
  weeklyOutputs,
  onToggleTask,
  onAddTask,
  onRollOverTask
}: TodayTasksTabProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Today's Tasks</CardTitle>
          <CardDescription>
            <TaskStats 
              completedCount={tasks.filter(t => t.completed).length} 
              totalCount={tasks.length} 
            />
          </CardDescription>
        </div>
        <AddTaskDialog onAddTask={onAddTask} weeklyOutputs={weeklyOutputs} />
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No tasks for today</p>
        ) : (
          tasks.map((task) => (
            <TaskPlanningItem 
              key={task.id} 
              task={task} 
              showRollOver={true}
              onToggleTask={onToggleTask}
              onRollOverTask={onRollOverTask}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};
