import React, { useState } from 'react';
import { Target, Plus, Edit2, Trash2, CheckCircle2, Clock, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  category: 'daily' | 'weekly' | 'monthly' | 'custom';
  deadline?: Date;
  createdAt: Date;
  completed: boolean;
  archived: boolean;
}

interface GoalsSectionProps {
  goals: Goal[];
  onAddGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'completed' | 'archived'>) => void;
  onEditGoal: (id: string, updates: Partial<Goal>) => void;
  onDeleteGoal: (id: string) => void;
  onUpdateProgress: (id: string, newValue: number) => void;
  onToggleComplete: (id: string) => void;
}

export const GoalsSection: React.FC<GoalsSectionProps> = ({
  goals,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onUpdateProgress,
  onToggleComplete
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetValue: 0,
    unit: '',
    category: 'daily' as Goal['category'],
    deadline: ''
  });

  const activeGoals = goals.filter(goal => !goal.archived && !goal.completed);
  const completedGoals = goals.filter(goal => goal.completed);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      targetValue: 0,
      unit: '',
      category: 'daily',
      deadline: ''
    });
  };

  const handleSubmit = () => {
    if (editingGoal) {
      onEditGoal(editingGoal.id, {
        title: formData.title,
        description: formData.description,
        targetValue: formData.targetValue,
        unit: formData.unit,
        category: formData.category,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined
      });
      setEditingGoal(null);
    } else {
      onAddGoal({
        title: formData.title,
        description: formData.description,
        targetValue: formData.targetValue,
        currentValue: 0,
        unit: formData.unit,
        category: formData.category,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined
      });
    }
    resetForm();
    setIsAddDialogOpen(false);
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      targetValue: goal.targetValue,
      unit: goal.unit,
      category: goal.category,
      deadline: goal.deadline ? format(goal.deadline, 'yyyy-MM-dd') : ''
    });
    setIsAddDialogOpen(true);
  };

  const getProgressPercentage = (goal: Goal) => {
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  };

  const getCategoryColor = (category: Goal['category']) => {
    switch (category) {
      case 'daily': return 'bg-blue-100 text-blue-800';
      case 'weekly': return 'bg-green-100 text-green-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      case 'custom': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (goal: Goal) => {
    if (!goal.deadline) return false;
    return new Date() > goal.deadline && !goal.completed;
  };

  return (
    <Card className="h-fit bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">
              Goals ({activeGoals.length})
            </CardTitle>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => {
                  setEditingGoal(null);
                  resetForm();
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingGoal ? 'Edit Goal' : 'Add New Goal'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Goal Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Complete 10 tasks"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What's this goal about?"
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetValue">Target</Label>
                    <Input
                      id="targetValue"
                      type="number"
                      value={formData.targetValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetValue: Number(e.target.value) }))}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="tasks, hours, etc."
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value: Goal['category']) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="deadline">Deadline (optional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSubmit} className="flex-1">
                    {editingGoal ? 'Update Goal' : 'Add Goal'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingGoal(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {activeGoals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No active goals yet</p>
            <p className="text-gray-400 text-xs">Set your first goal to start tracking progress!</p>
          </div>
        ) : (
          <>
            {activeGoals.map((goal) => {
              const progress = getProgressPercentage(goal);
              const overdue = isOverdue(goal);
              
              return (
                <div 
                  key={goal.id} 
                  className={`p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                    overdue ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 text-sm">{goal.title}</h3>
                        <Badge className={`text-xs ${getCategoryColor(goal.category)}`}>
                          {goal.category}
                        </Badge>
                        {overdue && (
                          <Badge variant="destructive" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                      {goal.description && (
                        <p className="text-xs text-gray-600 mb-2">{goal.description}</p>
                      )}
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Progress value={progress} className="flex-1 h-2" />
                        <span className="text-xs font-medium text-gray-700">
                          {goal.currentValue}/{goal.targetValue} {goal.unit}
                        </span>
                      </div>
                      
                      {goal.deadline && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          Due: {format(goal.deadline, 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(goal)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteGoal(goal.id)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 flex-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateProgress(goal.id, Math.max(0, goal.currentValue - 1))}
                        disabled={goal.currentValue <= 0}
                        className="h-7 w-7 p-0"
                      >
                        -
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateProgress(goal.id, goal.currentValue + 1)}
                        className="h-7 w-7 p-0"
                      >
                        +
                      </Button>
                    </div>
                    
                    {progress >= 100 && (
                      <Button
                        size="sm"
                        onClick={() => onToggleComplete(goal.id)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
        
        {completedGoals.length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Completed ({completedGoals.length})
            </h4>
            <div className="space-y-2">
              {completedGoals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700 line-through">{goal.title}</span>
                  <Badge className="text-xs bg-green-100 text-green-800">{goal.category}</Badge>
                </div>
              ))}
              {completedGoals.length > 3 && (
                <p className="text-xs text-gray-500 text-center">
                  +{completedGoals.length - 3} more completed goals
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};