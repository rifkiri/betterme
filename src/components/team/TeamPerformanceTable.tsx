
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TeamData } from '@/types/teamData';

interface TeamPerformanceTableProps {
  teamData: TeamData;
}

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

export const TeamPerformanceTable = ({ teamData }: TeamPerformanceTableProps) => {
  return (
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
  );
};
