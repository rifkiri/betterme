
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Task, WeeklyOutput } from '@/types/productivity';
import { AddTaskDialog } from './AddTaskDialog';
import { TaskItem } from './TaskItem';
import { DeletedTasksDialog } from './DeletedTasksDialog';

interface TasksSectionProps {
  tasks: Task[];
  deletedTasks: Task[];
  weeklyOutputs: WeeklyOutput[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'createdDate'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onRestoreTask: (id: string) => void;
  onPermanentlyDeleteTask: (id: string) => void;
}

export const TasksSection = ({ 
  tasks, 
  deletedTasks,
  weeklyOutputs,
  onAddTask, 
  onToggleTask, 
  onDeleteTask,
  onRestoreTask,
  onPermanentlyDeleteTask,
}: TasksSectionProps) => {
  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>
            Manage your tasks and link them to weekly outputs
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <DeletedTasksDialog 
            deletedTasks={deletedTasks}
            onRestoreTask={onRestoreTask}
            onPermanentlyDeleteTask={onPermanentlyDeleteTask}
          />
          <AddTaskDialog 
            onAddTask={onAddTask} 
            weeklyOutputs={weeklyOutputs}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Pending Tasks</h4>
            {pendingTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task}
                onToggleTask={onToggleTask}
                onDeleteTask={onDeleteTask}
                weeklyOutputs={weeklyOutputs}
              />
            ))}
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className={pendingTasks.length > 0 ? "border-t pt-3 mt-3" : ""}>
            <h4 className="text-sm font-medium text-green-600 mb-2">Completed Tasks</h4>
            {completedTasks.slice(0, 5).map(task => (
              <TaskItem 
                key={task.id} 
                task={task}
                onToggleTask={onToggleTask}
                onDeleteTask={onDeleteTask}
                weeklyOutputs={weeklyOutputs}
              />
            ))}
          </div>
        )}

        {tasks.length === 0 && (
          <p className="text-center text-gray-500 py-4">No tasks yet</p>
        )}
      </CardContent>
    </Card>
  );
};
