
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar } from 'lucide-react';
import { OverdueTask, OverdueOutput } from '@/types/individualData';
import { format } from 'date-fns';

interface OverdueSectionProps {
  overdueTasks: OverdueTask[];
  overdueOutputs: OverdueOutput[];
}

export const OverdueSection = ({ overdueTasks, overdueOutputs }: OverdueSectionProps) => {
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
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Filter out items that are not actually overdue (0 days late)
  const actuallyOverdueTasks = overdueTasks.filter(task => task.daysOverdue > 0);
  const actuallyOverdueOutputs = overdueOutputs.filter(output => output.daysOverdue > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Overdue Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Overdue Tasks
          </CardTitle>
          <CardDescription>Tasks that are past their due date</CardDescription>
        </CardHeader>
        <CardContent>
          {actuallyOverdueTasks.length > 0 ? (
            <div className="space-y-3">
              {actuallyOverdueTasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{task.title}</div>
                    <div className="text-xs text-muted-foreground">Due: {formatDueDate(task.originalDueDate)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600">{task.daysOverdue}d late</span>
                    {getPriorityBadge(task.priority)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No overdue tasks</p>
          )}
        </CardContent>
      </Card>

      {/* Overdue Outputs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            Overdue Outputs
          </CardTitle>
          <CardDescription>Bi-weekly outputs that are past their due date</CardDescription>
        </CardHeader>
        <CardContent>
          {actuallyOverdueOutputs.length > 0 ? (
            <div className="space-y-3">
              {actuallyOverdueOutputs.map((output, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{output.title}</div>
                      <div className="text-xs text-muted-foreground">Due: {formatDueDate(output.originalDueDate)}</div>
                    </div>
                    <span className="text-xs text-orange-600">{output.daysOverdue}d late</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={output.progress} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground">{output.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No overdue outputs</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
