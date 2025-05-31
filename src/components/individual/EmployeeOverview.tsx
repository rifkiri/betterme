
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmployeeData } from '@/types/individualData';

interface EmployeeOverviewProps {
  employee: EmployeeData;
}

export const EmployeeOverview = ({ employee }: EmployeeOverviewProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {employee.avatar}
          </div>
          <div>
            <CardTitle>{employee.name}</CardTitle>
            <CardDescription>{employee.role}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{employee.stats.habitsCompletionRate}%</div>
            <div className="text-sm text-muted-foreground">Habits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{employee.stats.tasksCompletionRate}%</div>
            <div className="text-sm text-muted-foreground">Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{employee.stats.outputsCompletionRate}%</div>
            <div className="text-sm text-muted-foreground">Outputs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{employee.stats.bestStreak}</div>
            <div className="text-sm text-muted-foreground">Best Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{employee.stats.currentStreak}</div>
            <div className="text-sm text-muted-foreground">Current Streak</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
