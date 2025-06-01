
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TeamData } from '@/types/teamData';

interface TeamMoodChartProps {
  teamData: TeamData;
}

export const TeamMoodChart = ({ teamData }: TeamMoodChartProps) => {
  // Generate mock team mood data for the past 30 days
  const generateTeamMoodData = () => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        teamAverage: Math.floor(Math.random() * 3) + 6 + Math.sin(Math.random() * Math.PI) * 1.5 // 5-9 range
      };
    });

    return days;
  };

  const chartData = generateTeamMoodData();

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
              {teamData.teamStats.teamAverageMood?.toFixed(1) || '7.2'}
            </p>
            <p className="text-xs text-gray-500">
              {getMoodLabel(teamData.teamStats.teamAverageMood || 7.2)}
            </p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Trend</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              {getMoodIcon(teamData.teamStats.teamMoodTrend)}
              <span className="text-sm font-medium capitalize">
                {teamData.teamStats.teamMoodTrend || 'stable'}
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
                  dataKey="teamAverage" 
                  stroke="#1f2937" 
                  strokeWidth={3}
                  name="Team Average"
                  dot={{ r: 4, fill: '#1f2937' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mood Scale Reference */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Mood Scale Reference</h4>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
            <div className="text-center">
              <div className="w-4 h-4 bg-red-500 rounded-full mx-auto mb-1"></div>
              <span>1-2: Terrible/Poor</span>
            </div>
            <div className="text-center">
              <div className="w-4 h-4 bg-orange-500 rounded-full mx-auto mb-1"></div>
              <span>3-4: Not great/Meh</span>
            </div>
            <div className="text-center">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mx-auto mb-1"></div>
              <span>5-6: Neutral/Okay</span>
            </div>
            <div className="text-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mx-auto mb-1"></div>
              <span>7-8: Good/Great</span>
            </div>
            <div className="text-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-1"></div>
              <span>9-10: Amazing</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
