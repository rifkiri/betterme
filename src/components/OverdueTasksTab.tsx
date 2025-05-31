
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Task } from '@/types/productivity';
import { TaskPlanningItem } from './TaskPlanningItem';

interface OverdueTasksTabProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onRollOverTask: (taskId: string) => void;
}

export const OverdueTasksTab = ({
  tasks,
  onToggleTask,
  onRollOverTask
}: OverdueTasksTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Overdue Tasks
        </CardTitle>
        <CardDescription>
          {tasks.length} tasks need attention
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Great! No overdue tasks</p>
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
