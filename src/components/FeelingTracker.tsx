import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Heart, Smile, Meh, Frown, Save, Edit } from 'lucide-react';
import { useMoodTracking } from '@/hooks/useMoodTracking';

export const FeelingTracker = () => {
  const {
    addMoodEntry,
    getMoodForDate
  } = useMoodTracking();
  const [feeling, setFeeling] = useState("5");
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Check for mood changes when date changes or mood data updates
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    // If date has changed, reset everything
    if (currentDate !== today) {
      setCurrentDate(today);
      setFeeling("5");
      setHasUserInteracted(false);
    }

    // Only set the mood from database if user hasn't interacted with the form yet
    if (!hasUserInteracted) {
      const todaysMood = getMoodForDate(today);
      if (todaysMood) {
        setFeeling(todaysMood.mood.toString());
      } else if (currentDate === today) {
        setFeeling("5");
      }
    }
  }, [getMoodForDate, currentDate, hasUserInteracted]);

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
    console.log('Recording mood:', parseInt(feeling), 'for date:', today);
    await addMoodEntry(today, parseInt(feeling));
    // Reset user interaction flag after successful save
    setHasUserInteracted(false);
  };

  const handleMoodChange = (value: string) => {
    console.log('Mood selection changed to:', value);
    setFeeling(value);
    setHasUserInteracted(true); // Mark that user has interacted
  };
  
  const moodOptions = [{
    value: "1",
    label: "1",
    color: "text-red-600"
  }, {
    value: "2",
    label: "2",
    color: "text-red-500"
  }, {
    value: "3",
    label: "3",
    color: "text-orange-600"
  }, {
    value: "4",
    label: "4",
    color: "text-yellow-600"
  }, {
    value: "5",
    label: "5",
    color: "text-yellow-500"
  }, {
    value: "6",
    label: "6",
    color: "text-blue-500"
  }, {
    value: "7",
    label: "7",
    color: "text-blue-600"
  }, {
    value: "8",
    label: "8",
    color: "text-green-500"
  }, {
    value: "9",
    label: "9",
    color: "text-green-600"
  }, {
    value: "10",
    label: "10",
    color: "text-green-700"
  }];

  const currentValue = parseInt(feeling);
  const today = new Date().toISOString().split('T')[0];
  const todaysMood = getMoodForDate(today);
  const hasRecordedMood = !!todaysMood;

  return <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getFeelingIcon(currentValue)}
              How are you feeling today?
            </CardTitle>
            <CardDescription>
              Select your mood on a scale of 1-10
              {hasRecordedMood && (
                <span className="block mt-1 text-xs text-blue-600">
                  You can change your recorded mood by selecting a new value
                </span>
              )}
            </CardDescription>
          </div>
          <Button onClick={handleRecordMood} size="sm" className="px-4">
            {hasRecordedMood ? (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Update Mood
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Record Mood
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={feeling} onValueChange={handleMoodChange} className="grid grid-cols-5 gap-3 sm:grid-cols-10">
          {moodOptions.map(option => <div key={option.value} className="flex flex-col items-center space-y-2">
              <div className="relative">
                <RadioGroupItem value={option.value} id={option.value} className="h-6 w-6 border-2 cursor-pointer hover:border-primary/50 transition-colors" />
              </div>
              <Label htmlFor={option.value} className={`cursor-pointer text-sm font-medium ${option.color} hover:scale-110 transition-all text-center select-none`}>
                {option.label}
              </Label>
            </div>)}
        </RadioGroup>
        
        <div className="text-center pt-4 border-t">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold">{currentValue}</span>
            <span className={`text-lg font-medium ${getFeelingColor(currentValue)}`}>
              {getFeelingText(currentValue)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>;
};
