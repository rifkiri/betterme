
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Award } from 'lucide-react';
import { EmployeeHabit } from '@/types/individualData';

interface HabitsPerformanceProps {
  habits: EmployeeHabit[];
}

export const HabitsPerformance = ({ habits }: HabitsPerformanceProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Daily Habits
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {habits.map((habit, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${habit.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm">{habit.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">{habit.streak} days</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
