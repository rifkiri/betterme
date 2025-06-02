
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Heart, Smile, Meh, Frown, Save } from 'lucide-react';
import { useMoodTracking } from '@/hooks/useMoodTracking';

export const FeelingTracker = () => {
  const [feeling, setFeeling] = useState([5]);
  const { addMoodEntry } = useMoodTracking();

  const getFeelingIcon = (value: number) => {
    if (value >= 8) return <Smile className="h-5 w-5 text-green-500" />;
    if (value >= 6) return <Heart className="h-5 w-5 text-blue-500" />;
    if (value >= 4) return <Meh className="h-5 w-5 text-yellow-500" />;
    return <Frown className="h-5 w-5 text-red-500" />;
  };

  const getFeelingText = (value: number) => {
    if (value >= 9) return "Amazing";
    if (value >= 8) return "Great";
    if (value >= 7) return "Good";
    if (value >= 6) return "Okay";
    if (value >= 5) return "Neutral";
    if (value >= 4) return "Meh";
    if (value >= 3) return "Not great";
    if (value >= 2) return "Poor";
    return "Terrible";
  };

  const getFeelingColor = (value: number) => {
    if (value >= 8) return "text-green-600";
    if (value >= 6) return "text-blue-600";
    if (value >= 4) return "text-yellow-600";
    return "text-red-600";
  };

  const handleRecordMood = async () => {
    const today = new Date().toISOString().split('T')[0];
    await addMoodEntry(today, feeling[0]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getFeelingIcon(feeling[0])}
          How are you feeling today?
        </CardTitle>
        <CardDescription>Track your mood on a scale of 1-10</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">1 - Terrible</span>
          <span className="text-sm text-gray-500">10 - Amazing</span>
        </div>
        
        <div className="px-2">
          <Slider
            value={feeling}
            onValueChange={setFeeling}
            max={10}
            min={1}
            step={1}
            className="w-full"
          />
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold">{feeling[0]}</span>
            <span className={`text-lg font-medium ${getFeelingColor(feeling[0])}`}>
              {getFeelingText(feeling[0])}
            </span>
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <Button onClick={handleRecordMood} size="sm" className="px-6">
            <Save className="h-4 w-4 mr-2" />
            Record Mood
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
