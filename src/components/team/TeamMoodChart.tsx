
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TeamData } from '@/types/teamData';

interface TeamMoodChartProps {
  teamData: TeamData;
}

export const TeamMoodChart = ({ teamData }: TeamMoodChartProps) => {
  // Generate mock mood data for the past 30 days
  const generateMoodData = () => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return days.map(date => {
      const dayData: any = { date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
      
      // Add mood data for each team member
      teamData.membersSummary.forEach(member => {
        dayData[member.name] = Math.floor(Math.random() * 4) + 6 + Math.sin(Math.random() * Math.PI) * 2; // 4-10 range with some variation
      });

      // Calculate team average
      const moodValues = teamData.membersSummary.map(member => dayData[member.name]);
      dayData.teamAverage = moodValues.reduce((sum, mood) => sum + mood, 0) / moodValues.length;

      return dayData;
    });
  };

  const chartData = generateMoodData();
  
  const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#84cc16'];

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
          Team Mood Trends
        </CardTitle>
        <CardDescription>
          Track individual and team mood fluctuations over the past 30 days
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Team Mood Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Team Average</p>
            <p className="text-xl font-bold text-blue-600">
              {teamData.teamStats.teamAverageMood?.toFixed(1) || '7.2'}
            </p>
            <p className="text-xs text-gray-500">
              {getMoodLabel(teamData.teamStats.teamAverageMood || 7.2)}
            </p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Team Trend</p>
            <div className="flex items-center justify-center gap-1">
              {getMoodIcon(teamData.teamStats.teamMoodTrend)}
              <span className="text-sm font-medium capitalize">
                {teamData.teamStats.teamMoodTrend || 'stable'}
              </span>
            </div>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Highest</p>
            <p className="text-xl font-bold text-green-600">
              {Math.max(...teamData.membersSummary.map(m => m.averageMood || 7))}
            </p>
          </div>

          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">Lowest</p>
            <p className="text-xl font-bold text-red-600">
              {Math.min(...teamData.membersSummary.map(m => m.averageMood || 7))}
            </p>
          </div>
        </div>

        {/* Individual Team Member Mood Stats */}
        <div>
          <h4 className="text-sm font-medium mb-3">Individual Mood Overview</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {teamData.membersSummary.map((member, index) => (
              <div key={member.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.role}</p>
                  </div>
                  {getMoodIcon(member.moodTrend)}
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: colors[index % colors.length] }}
                  ></div>
                  <span className="text-lg font-bold">
                    {member.averageMood?.toFixed(1) || (Math.random() * 3 + 6).toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getMoodLabel(member.averageMood || 7)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mood Trend Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3">30-Day Mood Trends</h4>
          <div className="h-80">
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
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)} - ${getMoodLabel(value)}`, 
                    name
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                
                {/* Team average line */}
                <Line 
                  type="monotone" 
                  dataKey="teamAverage" 
                  stroke="#1f2937" 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  name="Team Average"
                  dot={{ r: 4 }}
                />
                
                {/* Individual member lines */}
                {teamData.membersSummary.slice(0, 5).map((member, index) => (
                  <Line 
                    key={member.id}
                    type="monotone" 
                    dataKey={member.name} 
                    stroke={colors[index % colors.length]} 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name={member.name}
                  />
                ))}
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
