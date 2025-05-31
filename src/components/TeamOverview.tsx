
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Target, TrendingUp, TrendingDown, Users } from 'lucide-react';

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
  ]
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
