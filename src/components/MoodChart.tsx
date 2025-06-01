
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, eachDayOfInterval, isSameDay } from 'date-fns';

interface MoodEntry {
  date: Date;
  mood: number;
}

interface MoodChartProps {
  monthDays: Date[];
  selectedMonth: Date;
}

export const MoodChart = ({ monthDays, selectedMonth }: MoodChartProps) => {
  // Mock mood data - in real app this would come from your mood tracking storage
  const generateMockMoodData = (): MoodEntry[] => {
    return monthDays.map(day => ({
      date: day,
      mood: Math.floor(Math.random() * 10) + 1 // Random mood between 1-10
    }));
  };

  const moodData = generateMockMoodData();

  const chartData = moodData.map(entry => ({
    date: format(entry.date, 'MMM dd'),
    mood: entry.mood,
    fullDate: entry.date
  }));

  const averageMood = moodData.reduce((sum, entry) => sum + entry.mood, 0) / moodData.length;
  const highestMood = Math.max(...moodData.map(entry => entry.mood));
  const lowestMood = Math.min(...moodData.map(entry => entry.mood));

  const getMoodTrend = () => {
    if (moodData.length < 2) return { trend: 'stable', icon: Minus };
    
    const firstHalf = moodData.slice(0, Math.floor(moodData.length / 2));
    const secondHalf = moodData.slice(Math.floor(moodData.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, entry) => sum + entry.mood, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, entry) => sum + entry.mood, 0) / secondHalf.length;
    
    if (secondHalfAvg > firstHalfAvg + 0.5) return { trend: 'improving', icon: TrendingUp };
    if (secondHalfAvg < firstHalfAvg - 0.5) return { trend: 'declining', icon: TrendingDown };
    return { trend: 'stable', icon: Minus };
  };

  const moodTrend = getMoodTrend();
  const TrendIcon = moodTrend.icon;

  const getMoodColor = (mood: number) => {
    if (mood >= 8) return '#10b981'; // green
    if (mood >= 6) return '#3b82f6'; // blue
    if (mood >= 4) return '#f59e0b'; // yellow
    return '#ef4444'; // red
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
          Monthly Mood Tracker
        </CardTitle>
        <CardDescription>
          Track your daily mood fluctuations throughout {format(selectedMonth, 'MMMM yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mood Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Average Mood</p>
            <p className="text-xl font-bold" style={{ color: getMoodColor(averageMood) }}>
              {averageMood.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500">{getMoodLabel(averageMood)}</p>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Best Day</p>
            <p className="text-xl font-bold text-green-600">{highestMood}</p>
            <p className="text-xs text-gray-500">{getMoodLabel(highestMood)}</p>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">Lowest Day</p>
            <p className="text-xl font-bold text-red-600">{lowestMood}</p>
            <p className="text-xs text-gray-500">{getMoodLabel(lowestMood)}</p>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Trend</p>
            <div className="flex items-center justify-center gap-1">
              <TrendIcon className="h-4 w-4" />
              <span className="text-sm font-medium capitalize">{moodTrend.trend}</span>
            </div>
          </div>
        </div>

        {/* Mood Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3">Daily Mood Trend</h4>
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
                    `${value} - ${getMoodLabel(value)}`, 
                    'Mood'
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#8b5cf6' }}
                  activeDot={{ r: 6, fill: '#8b5cf6' }}
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
