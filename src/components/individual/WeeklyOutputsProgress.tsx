
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';
import { EmployeeWeeklyOutput } from '@/types/individualData';
import { format } from 'date-fns';

interface WeeklyOutputsProgressProps {
  outputs: EmployeeWeeklyOutput[];
}

export const WeeklyOutputsProgress = ({ outputs }: WeeklyOutputsProgressProps) => {
  const formatDueDate = (dueDate: string | Date) => {
    if (!dueDate) return 'No due date';
    
    try {
      const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Bi-Weekly Outputs Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {outputs.map((output, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{output.title}</span>
                <span className="text-sm text-muted-foreground">Due: {formatDueDate(output.dueDate)}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Progress value={output.progress} className="flex-1" />
                <span className="text-sm font-medium">{output.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
