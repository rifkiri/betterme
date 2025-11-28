
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { TeamData } from '@/types/teamData';

interface OverdueItemsSectionProps {
  teamData: TeamData;
}

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

const getTrendIcon = (trend: string, change: string) => {
  const isGettingWorse = trend === 'up';
  const IconComponent = isGettingWorse ? TrendingUp : TrendingDown;
  const colorClass = isGettingWorse ? 'text-red-600' : 'text-green-600';
  
  return (
    <span className={`flex items-center gap-1 ${colorClass}`}>
      <IconComponent className="h-3 w-3" />
      {change}
    </span>
  );
};

export const OverdueItemsSection = ({ teamData }: OverdueItemsSectionProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Overdue Tasks
          </CardTitle>
          <CardDescription>
            Tasks that are past their due date - trend vs last week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl font-bold text-red-600">{teamData.overdueStats.tasksCount}</div>
            {getTrendIcon(teamData.overdueStats.tasksTrend, teamData.overdueStats.tasksChange)}
          </div>
          <div className="space-y-3">
            {teamData.overdueTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium">{task.title}</div>
                  <div className="text-xs text-muted-foreground">{task.assignee}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600">{task.daysOverdue}d late</span>
                  {getPriorityBadge(task.priority)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            Overdue Outputs
          </CardTitle>
          <CardDescription>
            Bi-weekly outputs that are past their due date - trend vs last week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl font-bold text-orange-600">{teamData.overdueStats.outputsCount}</div>
            {getTrendIcon(teamData.overdueStats.outputsTrend, teamData.overdueStats.outputsChange)}
          </div>
          <div className="space-y-3">
            {teamData.overdueOutputs.map((output) => (
              <div key={output.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{output.title}</div>
                    <div className="text-xs text-muted-foreground">{output.assignee}</div>
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
        </CardContent>
      </Card>
    </div>
  );
};
