import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { EmployeeTask } from '@/types/individualData';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RecentTasksCardProps {
  tasks: EmployeeTask[];
  allTasks?: EmployeeTask[];
}

export const RecentTasksCard = ({ tasks, allTasks = [] }: RecentTasksCardProps) => {
  const [taskView, setTaskView] = useState<'recent' | 'ongoing'>('recent');

  const displayedTasks = React.useMemo(() => {
    if (taskView === 'ongoing') {
      return allTasks.filter(t => !t.completed);
    }
    return tasks.slice(0, 5);
  }, [tasks, allTasks, taskView]);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case 'Medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'Low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const formatDueDate = (dueDate: string | Date) => {
    if (!dueDate) return 'No due date';
    try {
      const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
      return format(date, 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {taskView === 'ongoing' ? 'All Ongoing Tasks' : 'Recent Tasks'}
          </CardTitle>
          <Select value={taskView} onValueChange={(v) => setTaskView(v as 'recent' | 'ongoing')}>
            <SelectTrigger className="w-[150px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent (5)</SelectItem>
              <SelectItem value="ongoing">All Ongoing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {displayedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No tasks to display</p>
          ) : (
            displayedTasks.map((task, index) => (
              <div key={task.id || index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${task.completed ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <div>
                    <div className="text-sm font-medium">{task.title}</div>
                    <div className="text-xs text-muted-foreground">Due: {formatDueDate(task.dueDate)}</div>
                  </div>
                </div>
                {getPriorityBadge(task.priority)}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
