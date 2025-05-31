
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Target, TrendingUp, TrendingDown, Users, AlertTriangle, Calendar } from 'lucide-react';

// Mock team data
const teamData = {
  totalMembers: 8,
  activeMembers: 7,
  teamStats: {
    habitsCompletionRate: 78,
    tasksCompletionRate: 85,
    outputsCompletionRate: 72,
    avgHabitStreak: 12
  },
  membersSummary: [
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'Senior Developer',
      habitsRate: 90,
      tasksRate: 95,
      outputsRate: 88,
      status: 'excellent'
    },
    {
      id: '2',
      name: 'Mike Chen',
      role: 'Product Manager',
      habitsRate: 85,
      tasksRate: 78,
      outputsRate: 82,
      status: 'good'
    },
    {
      id: '3',
      name: 'Emily Davis',
      role: 'Designer',
      habitsRate: 75,
      tasksRate: 88,
      outputsRate: 65,
      status: 'average'
    },
    {
      id: '4',
      name: 'Alex Rodriguez',
      role: 'Developer',
      habitsRate: 60,
      tasksRate: 70,
      outputsRate: 55,
      status: 'needs-attention'
    },
    {
      id: '5',
      name: 'Lisa Wang',
      role: 'QA Engineer',
      habitsRate: 88,
      tasksRate: 92,
      outputsRate: 78,
      status: 'good'
    }
  ],
  overdueTasks: [
    {
      id: '1',
      title: 'API Documentation Update',
      assignee: 'Alex Rodriguez',
      priority: 'High',
      daysOverdue: 3,
      originalDueDate: '2024-05-28'
    },
    {
      id: '2',
      title: 'User Testing Report',
      assignee: 'Emily Davis',
      priority: 'Medium',
      daysOverdue: 1,
      originalDueDate: '2024-05-30'
    },
    {
      id: '3',
      title: 'Code Review Checklist',
      assignee: 'Mike Chen',
      priority: 'Low',
      daysOverdue: 2,
      originalDueDate: '2024-05-29'
    }
  ],
  overdueOutputs: [
    {
      id: '1',
      title: 'Q2 Marketing Campaign',
      assignee: 'Mike Chen',
      progress: 65,
      daysOverdue: 5,
      originalDueDate: '2024-05-26'
    },
    {
      id: '2',
      title: 'Mobile App Redesign',
      assignee: 'Emily Davis',
      progress: 40,
      daysOverdue: 2,
      originalDueDate: '2024-05-29'
    },
    {
      id: '3',
      title: 'Performance Optimization',
      assignee: 'Alex Rodriguez',
      progress: 30,
      daysOverdue: 4,
      originalDueDate: '2024-05-27'
    }
  ],
  overdueStats: {
    tasksCount: 3,
    outputsCount: 3,
    tasksTrend: 'up', // 'up' means getting worse, 'down' means improving
    outputsTrend: 'down',
    tasksChange: '+2',
    outputsChange: '-1'
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'excellent':
      return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    case 'good':
      return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    case 'average':
      return <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>;
    case 'needs-attention':
      return <Badge className="bg-red-100 text-red-800">Needs Attention</Badge>;
    default:
      return <Badge>Unknown</Badge>;
  }
};

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

export const TeamOverview = () => {
  return (
    <div className="space-y-6">
      {/* Team Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamData.activeMembers}/{teamData.totalMembers}</div>
            <p className="text-xs text-muted-foreground">Active this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Habits Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamData.teamStats.habitsCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">Team average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completion</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamData.teamStats.tasksCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outputs Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamData.teamStats.outputsCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">Weekly outputs</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Items Summary */}
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
              Weekly outputs that are past their due date - trend vs last week
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

      {/* Team Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance Overview</CardTitle>
          <CardDescription>Individual performance metrics for all team members</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Habits</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Outputs</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamData.membersSummary.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground">{member.role}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress value={member.habitsRate} className="w-12 h-2" />
                      <span className="text-sm text-muted-foreground">{member.habitsRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress value={member.tasksRate} className="w-12 h-2" />
                      <span className="text-sm text-muted-foreground">{member.tasksRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress value={member.outputsRate} className="w-12 h-2" />
                      <span className="text-sm text-muted-foreground">{member.outputsRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Team Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Team Trends</CardTitle>
          <CardDescription>Performance trends over the last 4 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Habits Completion Trend</span>
                <span className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  +5%
                </span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tasks Completion Trend</span>
                <span className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  +3%
                </span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Outputs Completion Trend</span>
                <span className="flex items-center gap-1 text-red-600">
                  <TrendingDown className="h-3 w-3" />
                  -2%
                </span>
              </div>
              <Progress value={72} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
