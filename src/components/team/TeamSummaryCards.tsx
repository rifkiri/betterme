
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, CheckCircle, TrendingUp } from 'lucide-react';
import { TeamData } from '@/types/teamData';

interface TeamSummaryCardsProps {
  teamData: TeamData;
}

export const TeamSummaryCards = ({ teamData }: TeamSummaryCardsProps) => {
  return (
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
  );
};
