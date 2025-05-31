
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { Task } from '@/types/productivity';
import { TaskPlanningItem } from './TaskPlanningItem';

interface CompletedTasksTabProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
}

export const CompletedTasksTab = ({
  tasks,
  onToggleTask
}: CompletedTasksTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-green-500" />
          Completed Tasks
        </CardTitle>
        <CardDescription>
          {tasks.length} tasks completed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No completed tasks yet</p>
        ) : (
          tasks.slice(0, 10).map((task) => (
            <TaskPlanningItem 
              key={task.id} 
              task={task}
              onToggleTask={onToggleTask}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};
