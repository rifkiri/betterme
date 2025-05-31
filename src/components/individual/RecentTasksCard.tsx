
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { EmployeeTask } from '@/types/individualData';

interface RecentTasksCardProps {
  tasks: EmployeeTask[];
}

export const RecentTasksCard = ({ tasks }: RecentTasksCardProps) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Recent Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${task.completed ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <div>
                  <div className="text-sm font-medium">{task.title}</div>
                  <div className="text-xs text-muted-foreground">Due: {task.dueDate}</div>
                </div>
              </div>
              {getPriorityBadge(task.priority)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
