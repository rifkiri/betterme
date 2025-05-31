
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, CheckCircle, Target, TrendingUp, Clock, Award, AlertTriangle } from 'lucide-react';

// Mock individual data
const employeeData = {
  'sarah-johnson': {
    name: 'Sarah Johnson',
    role: 'Senior Developer',
    avatar: 'SJ',
    stats: {
      habitsCompletionRate: 90,
      tasksCompletionRate: 95,
      outputsCompletionRate: 88,
      bestStreak: 21,
      currentStreak: 14
    },
    habits: [
      { name: 'Morning Exercise', completed: true, streak: 14 },
      { name: 'Code Review', completed: true, streak: 21 },
      { name: 'Reading Tech Articles', completed: false, streak: 7 },
      { name: 'Team Standup', completed: true, streak: 18 }
    ],
    recentTasks: [
      { title: 'API Integration', priority: 'High', completed: true, dueDate: '2024-05-30' },
      { title: 'Database Optimization', priority: 'Medium', completed: true, dueDate: '2024-05-29' },
      { title: 'Code Documentation', priority: 'Low', completed: false, dueDate: '2024-05-31' }
    ],
    weeklyOutputs: [
      { title: 'User Authentication System', progress: 95, dueDate: '2024-06-02' },
      { title: 'Performance Monitoring Dashboard', progress: 70, dueDate: '2024-06-07' }
    ],
    overdueTasks: [
      { title: 'Legacy Code Refactoring', priority: 'Medium', daysOverdue: 2, originalDueDate: '2024-05-29' }
    ],
    overdueOutputs: [
      { title: 'Mobile App Integration', progress: 60, daysOverdue: 1, originalDueDate: '2024-05-30' }
    ]
  },
  'mike-chen': {
    name: 'Mike Chen',
    role: 'Product Manager',
    avatar: 'MC',
    stats: {
      habitsCompletionRate: 85,
      tasksCompletionRate: 78,
      outputsCompletionRate: 82,
      bestStreak: 15,
      currentStreak: 9
    },
    habits: [
      { name: 'Product Research', completed: true, streak: 9 },
      { name: 'Stakeholder Check-ins', completed: true, streak: 12 },
      { name: 'Market Analysis', completed: false, streak: 3 },
      { name: 'Team Planning', completed: true, streak: 15 }
    ],
    recentTasks: [
      { title: 'Feature Specification', priority: 'High', completed: false, dueDate: '2024-05-31' },
      { title: 'User Interview Analysis', priority: 'Medium', completed: true, dueDate: '2024-05-29' },
      { title: 'Roadmap Update', priority: 'High', completed: true, dueDate: '2024-05-28' }
    ],
    weeklyOutputs: [
      { title: 'Q3 Product Roadmap', progress: 85, dueDate: '2024-06-01' },
      { title: 'User Research Report', progress: 60, dueDate: '2024-06-05' }
    ],
    overdueTasks: [
      { title: 'Market Competitor Analysis', priority: 'High', daysOverdue: 3, originalDueDate: '2024-05-28' },
      { title: 'Product Metrics Review', priority: 'Medium', daysOverdue: 1, originalDueDate: '2024-05-30' }
    ],
    overdueOutputs: [
      { title: 'Q2 Marketing Campaign Strategy', progress: 40, daysOverdue: 4, originalDueDate: '2024-05-27' }
    ]
  }
};

export const IndividualPerformance = () => {
  const [selectedEmployee, setSelectedEmployee] = useState('sarah-johnson');
  const employee = employeeData[selectedEmployee as keyof typeof employeeData];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case 'Medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'Low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Employee Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Team Member</CardTitle>
          <CardDescription>Choose a team member to view their detailed performance</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sarah-johnson">Sarah Johnson - Senior Developer</SelectItem>
              <SelectItem value="mike-chen">Mike Chen - Product Manager</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Employee Overview */}
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

      {/* Overdue Items Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overdue Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Overdue Tasks
            </CardTitle>
            <CardDescription>Tasks that are past their due date</CardDescription>
          </CardHeader>
          <CardContent>
            {employee.overdueTasks.length > 0 ? (
              <div className="space-y-3">
                {employee.overdueTasks.map((task, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{task.title}</div>
                      <div className="text-xs text-muted-foreground">Due: {task.originalDueDate}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600">{task.daysOverdue}d late</span>
                      {getPriorityBadge(task.priority)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No overdue tasks</p>
            )}
          </CardContent>
        </Card>

        {/* Overdue Outputs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              Overdue Outputs
            </CardTitle>
            <CardDescription>Weekly outputs that are past their due date</CardDescription>
          </CardHeader>
          <CardContent>
            {employee.overdueOutputs.length > 0 ? (
              <div className="space-y-3">
                {employee.overdueOutputs.map((output, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{output.title}</div>
                        <div className="text-xs text-muted-foreground">Due: {output.originalDueDate}</div>
                      </div>
                      <span className="text-xs text-orange-600">{output.daysOverdue}d late</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={output.progress} className="flex-1 h-2" />
                      <span className="text-xs text-muted-foreground">{output.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No overdue outputs</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Habits Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Daily Habits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employee.habits.map((habit, index) => (
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

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recent Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employee.recentTasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${task.completed ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <div>
                      <div className="text-sm font-medium">{task.title}</div>
                      <div className="text-xs text-muted-foreground">Due: {task.dueDate}</div>
                    </div>
                  </div>
                  {getPriorityBadge(task.priority)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Outputs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weekly Outputs Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employee.weeklyOutputs.map((output, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{output.title}</span>
                  <span className="text-sm text-muted-foreground">Due: {output.dueDate}</span>
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
    </div>
  );
};
