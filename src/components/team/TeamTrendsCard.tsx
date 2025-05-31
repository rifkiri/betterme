
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { TeamData } from '@/types/teamData';

interface TeamTrendsCardProps {
  teamData: TeamData;
}

export const TeamTrendsCard = ({ teamData }: TeamTrendsCardProps) => {
  return (
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
            <Progress value={teamData.teamStats.habitsCompletionRate} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tasks Completion Trend</span>
              <span className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-3 w-3" />
                +3%
              </span>
            </div>
            <Progress value={teamData.teamStats.tasksCompletionRate} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Outputs Completion Trend</span>
              <span className="flex items-center gap-1 text-red-600">
                <TrendingDown className="h-3 w-3" />
                -2%
              </span>
            </div>
            <Progress value={teamData.teamStats.outputsCompletionRate} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
