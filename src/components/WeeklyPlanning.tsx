
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar,
  Target,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { format, startOfWeek, addDays, endOfWeek } from 'date-fns';
import { Task, WeeklyPlan } from '@/types/productivity';

interface WeeklyPlanningProps {
  currentWeekTasks: Task[];
  weeklyPlans: WeeklyPlan[];
  onCreateWeeklyPlan: (plan: Omit<WeeklyPlan, 'id'>) => void;
}

export const WeeklyPlanning = ({
  currentWeekTasks,
  weeklyPlans,
  onCreateWeeklyPlan
}: WeeklyPlanningProps) => {
  const [goals, setGoals] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');
  const [newGoal, setNewGoal] = useState('');

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const completedTasks = currentWeekTasks.filter(task => task.completed);
  const weekProgress = currentWeekTasks.length > 0 ? Math.round((completedTasks.length / currentWeekTasks.length) * 100) : 0;

  const addGoal = () => {
    if (newGoal.trim()) {
      setGoals(prev => [...prev, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const removeGoal = (index: number) => {
    setGoals(prev => prev.filter((_, i) => i !== index));
  };

  const saveWeeklyPlan = () => {
    const validGoals = goals.filter(goal => goal.trim() !== '');
    if (validGoals.length > 0) {
      onCreateWeeklyPlan({
        weekStartDate: weekStart,
        goals: validGoals,
        tasks: currentWeekTasks,
        notes: notes || undefined
      });
      setGoals(['']);
      setNotes('');
    }
  };

  const getTasksForDay = (date: Date) => {
    // Since tasks no longer have due dates, we'll return all tasks for now
    // This can be customized based on your specific requirements
    return [];
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Week of {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
            </CardTitle>
            <CardDescription>
              {completedTasks.length} of {currentWeekTasks.length} tasks completed this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Weekly Progress</span>
                <span className="text-sm text-gray-500">{weekProgress}%</span>
              </div>
              <Progress value={weekProgress} className="h-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weekDays.map((day, index) => {
                const dayTasks = getTasksForDay(day);
                const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                
                return (
                  <div 
                    key={index} 
                    className={`p-3 border rounded-lg ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}
                  >
                    <h4 className={`font-medium text-sm mb-2 ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                      {format(day, 'EEE dd')}
                      {isToday && <span className="ml-1 text-xs">(Today)</span>}
                    </h4>
                    <div className="space-y-1">
                      {dayTasks.length === 0 ? (
                        <p className="text-xs text-gray-400">No tasks</p>
                      ) : (
                        dayTasks.map(task => (
                          <div key={task.id} className="flex items-center space-x-1">
                            {task.completed ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                              <div className="h-3 w-3 border border-gray-300 rounded-full" />
                            )}
                            <span className={`text-xs ${task.completed ? 'line-through text-gray-500' : ''}`}>
                              {task.title.length > 20 ? `${task.title.slice(0, 20)}...` : task.title}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Weekly Goals
            </CardTitle>
            <CardDescription>Set your goals for this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {goals.map((goal, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={goal}
                    onChange={(e) => {
                      const newGoals = [...goals];
                      newGoals[index] = e.target.value;
                      setGoals(newGoals);
                    }}
                    placeholder="Enter a goal..."
                    className="flex-1"
                  />
                  {goals.length > 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeGoal(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <div className="flex items-center space-x-2">
                <Input
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Add another goal..."
                  onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                />
                <Button size="sm" onClick={addGoal}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Weekly Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes or reflections for the week..."
                className="resize-none"
                rows={3}
              />
            </div>

            <Button onClick={saveWeeklyPlan} className="w-full">
              Save Weekly Plan
            </Button>
          </CardContent>
        </Card>
      </div>

      {weeklyPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Weekly Plans</CardTitle>
            <CardDescription>Review your past weekly goals and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyPlans.slice(0, 3).map((plan) => (
                <div key={plan.id} className="p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-2">
                    Week of {format(plan.weekStartDate, 'MMM dd, yyyy')}
                  </h4>
                  <div className="space-y-1 mb-3">
                    {plan.goals.map((goal, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          Goal {index + 1}
                        </Badge>
                        <span className="text-sm">{goal}</span>
                      </div>
                    ))}
                  </div>
                  {plan.notes && (
                    <p className="text-sm text-gray-600 italic">{plan.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
