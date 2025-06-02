
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TeamData } from '@/types/teamData';

interface TeamMoodChartProps {
  teamData: TeamData;
}

export const TeamMoodChart = ({ teamData }: TeamMoodChartProps) => {
  // Use real mood data from teamData or empty array
  const chartData = teamData.moodData || [];

  const getMoodIcon = (trend?: string) => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getMoodLabel = (mood: number) => {
    if (mood >= 9) return 'Amazing';
    if (mood >= 8) return 'Great';
    if (mood >= 7) return 'Good';
    if (mood >= 6) return 'Okay';
    if (mood >= 5) return 'Neutral';
    if (mood >= 4) return 'Meh';
    if (mood >= 3) return 'Not great';
    if (mood >= 2) return 'Poor';
    return 'Terrible';
  };

  // Show empty state if no mood data
  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Team Mood Overview
          </CardTitle>
          <CardDescription>
            Track overall team mood trends over the past 30 days
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No mood data available</p>
            <p className="text-sm">Mood tracking data will appear here once team members start logging their moods</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          Team Mood Overview
        </CardTitle>
        <CardDescription>
          Track overall team mood trends over the past 30 days
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Team Mood Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Current Average</p>
            <p className="text-2xl font-bold text-blue-600">
              {teamData.teamStats.teamAverageMood?.toFixed(1) || '0.0'}
            </p>
            <p className="text-xs text-gray-500">
              {teamData.teamStats.teamAverageMood ? getMoodLabel(teamData.teamStats.teamAverageMood) : 'No data'}
            </p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Trend</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              {getMoodIcon(teamData.teamStats.teamMoodTrend)}
              <span className="text-sm font-medium capitalize">
                {teamData.teamStats.teamMoodTrend || 'No trend'}
              </span>
            </div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Team Size</p>
            <p className="text-2xl font-bold text-green-600">
              {teamData.activeMembers}/{teamData.totalMembers}
            </p>
            <p className="text-xs text-gray-500">Active Members</p>
          </div>
        </div>

        {/* Team Mood Trend Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3">30-Day Team Mood Trend</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[1, 10]} 
                  fontSize={12}
                  tickCount={10}
                />
                <Tooltip 
                  formatter={(value: number) => [
                    `${value.toFixed(1)} - ${getMoodLabel(value)}`, 
                    'Team Average'
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="#1f2937" 
                  strokeWidth={3}
                  name="Team Average"
                  dot={{ r: 4, fill: '#1f2937' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mood Scale Reference - Made Vertical */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium mb-4">Mood Scale Reference</h4>
          <div className="flex flex-col space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
              <span className="text-sm">9-10: Amazing</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0"></div>
              <span className="text-sm">7-8: Good/Great</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-yellow-500 rounded-full flex-shrink-0"></div>
              <span className="text-sm">5-6: Neutral/Okay</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-orange-500 rounded-full flex-shrink-0"></div>
              <span className="text-sm">3-4: Not great/Meh</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
              <span className="text-sm">1-2: Terrible/Poor</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
