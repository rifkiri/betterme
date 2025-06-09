
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Target, Heart } from 'lucide-react';
import { useTeamDataRealtime } from '@/hooks/useTeamDataRealtime';
import { Badge } from '@/components/ui/badge';

export const TeamMemberOverview = () => {
  const { teamData, isLoading, error } = useTeamDataRealtime();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Team Overview
          </CardTitle>
          <CardDescription>Quick overview of team performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !teamData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Team Overview
          </CardTitle>
          <CardDescription>Quick overview of team performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>Team data not available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getMoodLabel = (mood: number) => {
    if (mood >= 8) return 'Great';
    if (mood >= 6) return 'Good';
    if (mood >= 4) return 'Okay';
    return 'Needs Support';
  };

  const getMoodBadgeColor = (mood: number) => {
    if (mood >= 8) return 'bg-green-100 text-green-800';
    if (mood >= 6) return 'bg-blue-100 text-blue-800';
    if (mood >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          Team Overview
        </CardTitle>
        <CardDescription>Quick overview of team performance this week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Team Size */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Team Members</p>
            <p className="text-xl font-bold text-blue-600">
              {teamData.activeMembers}/{teamData.totalMembers}
            </p>
            <p className="text-xs text-gray-500">Active</p>
          </div>

          {/* Team Habits */}
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Habits</p>
            <p className="text-xl font-bold text-green-600">
              {teamData.teamStats.habitsCompletionRate}%
            </p>
            <p className="text-xs text-gray-500">Completion</p>
          </div>

          {/* Team Tasks */}
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Tasks</p>
            <p className="text-xl font-bold text-purple-600">
              {teamData.teamStats.tasksCompletionRate}%
            </p>
            <p className="text-xs text-gray-500">Completion</p>
          </div>

          {/* Team Mood */}
          <div className="text-center p-4 bg-pink-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Heart className="h-5 w-5 text-pink-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Team Mood</p>
            {teamData.teamStats.teamAverageMood ? (
              <>
                <p className="text-xl font-bold text-pink-600">
                  {teamData.teamStats.teamAverageMood.toFixed(1)}
                </p>
                <Badge 
                  className={`text-xs ${getMoodBadgeColor(teamData.teamStats.teamAverageMood)}`}
                >
                  {getMoodLabel(teamData.teamStats.teamAverageMood)}
                </Badge>
              </>
            ) : (
              <p className="text-sm text-gray-500">No data</p>
            )}
          </div>
        </div>

        {/* Team Progress Summary */}
        {teamData.membersSummary.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Team Status</h4>
            <div className="flex flex-wrap gap-2">
              {['excellent', 'good', 'average', 'needs-attention'].map((status) => {
                const count = teamData.membersSummary.filter(member => member.status === status).length;
                if (count === 0) return null;
                
                const statusColors = {
                  excellent: 'bg-green-100 text-green-800',
                  good: 'bg-blue-100 text-blue-800',
                  average: 'bg-yellow-100 text-yellow-800',
                  'needs-attention': 'bg-red-100 text-red-800'
                };

                const statusLabels = {
                  excellent: 'Excellent',
                  good: 'Good',
                  average: 'Average',
                  'needs-attention': 'Needs Attention'
                };

                return (
                  <Badge key={status} className={`${statusColors[status]} text-xs`}>
                    {count} {statusLabels[status]}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
