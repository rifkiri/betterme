
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { TeamData } from '@/types/teamData';

interface TeamTrendsCardProps {
  teamData: TeamData;
}

export const TeamTrendsCard = ({ teamData }: TeamTrendsCardProps) => {
  const { teamStats, teamTrends } = teamData;

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return TrendingUp;
    if (trend === 'down') return TrendingDown;
    return TrendingUp; // Default for stable
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const formatTrendChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change}%`;
  };

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
              <span className={`flex items-center gap-1 ${getTrendColor(teamTrends?.habitsTrend || 'stable')}`}>
                {React.createElement(getTrendIcon(teamTrends?.habitsTrend || 'stable'), { className: "h-3 w-3" })}
                {formatTrendChange(teamTrends?.habitsChange || 0)}
              </span>
            </div>
            <Progress value={teamStats.habitsCompletionRate} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tasks Completion Trend</span>
              <span className={`flex items-center gap-1 ${getTrendColor(teamTrends?.tasksTrend || 'stable')}`}>
                {React.createElement(getTrendIcon(teamTrends?.tasksTrend || 'stable'), { className: "h-3 w-3" })}
                {formatTrendChange(teamTrends?.tasksChange || 0)}
              </span>
            </div>
            <Progress value={teamStats.tasksCompletionRate} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Outputs Completion Trend</span>
              <span className={`flex items-center gap-1 ${getTrendColor(teamTrends?.outputsTrend || 'stable')}`}>
                {React.createElement(getTrendIcon(teamTrends?.outputsTrend || 'stable'), { className: "h-3 w-3" })}
                {formatTrendChange(teamTrends?.outputsChange || 0)}
              </span>
            </div>
            <Progress value={teamStats.outputsCompletionRate} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
