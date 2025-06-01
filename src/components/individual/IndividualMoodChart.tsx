
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface IndividualMoodChartProps {
  employeeName: string;
}

export const IndividualMoodChart = ({ employeeName }: IndividualMoodChartProps) => {
  // Generate mock mood data for the selected employee for the past 30 days
  const generateMoodData = () => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mood: Math.floor(Math.random() * 4) + 6 + Math.sin(i * 0.2) * 1.5 // 4.5-9.5 range with some variation
      };
    });
    return days;
  };

  const chartData = generateMoodData();
  const currentMood = chartData[chartData.length - 1].mood;
  const averageMood = chartData.reduce((sum, day) => sum + day.mood, 0) / chartData.length;
  const trend = currentMood > averageMood ? 'improving' : currentMood < averageMood ? 'declining' : 'stable';

  const getMoodIcon = (trendType: string) => {
    if (trendType === 'improving') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trendType === 'declining') return <TrendingDown className="h-4 w-4 text-red-500" />;
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

  const getMoodColor = (mood: number) => {
    if (mood >= 8) return '#10b981'; // green
    if (mood >= 6) return '#3b82f6'; // blue
    if (mood >= 4) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          {employeeName}'s Mood Trends
        </CardTitle>
        <CardDescription>
          Track mood fluctuations over the past 30 days
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mood Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Current Mood</p>
            <p className="text-xl font-bold" style={{ color: getMoodColor(currentMood) }}>
              {currentMood.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500">{getMoodLabel(currentMood)}</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">30-Day Average</p>
            <p className="text-xl font-bold text-gray-600">
              {averageMood.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500">{getMoodLabel(averageMood)}</p>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Trend</p>
            <div className="flex items-center justify-center gap-1">
              {getMoodIcon(trend)}
              <span className="text-sm font-medium capitalize">{trend}</span>
            </div>
          </div>
        </div>

        {/* Mood Trend Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3">30-Day Mood History</h4>
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
                    'Mood'
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6366f1' }}
                  activeDot={{ r: 6 }}
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
