import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Goal } from '@/types/productivity';
import { Target, Users, UserPlus } from 'lucide-react';

interface WorkGoalSelectionDialogProps {
  availableGoals: Goal[];
  onSelectGoal: (goalId: string) => void;
}

export const WorkGoalSelectionDialog = ({ availableGoals, onSelectGoal }: WorkGoalSelectionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');

  const workGoals = availableGoals.filter(goal => goal.category === 'work');

  const handleSelectGoal = () => {
    if (selectedGoalId) {
      onSelectGoal(selectedGoalId);
      setSelectedGoalId('');
      setOpen(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <UserPlus className="h-4 w-4 mr-2" />
          Join Work Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Available Work Goals
          </DialogTitle>
          <DialogDescription>
            Select a work goal to join as a member. You'll be able to contribute to its completion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {workGoals.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No work goals available</p>
                  <p className="text-sm mt-1">Ask your manager to create work goals for the team.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {workGoals.map((goal) => (
                  <Card 
                    key={goal.id} 
                    className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                      selectedGoalId === goal.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedGoalId(goal.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">{goal.title}</h3>
                          {goal.description && (
                            <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          Work
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Progress</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${getProgressColor(goal.progress)}`}
                                style={{ width: `${Math.min(goal.progress, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {goal.progress}%
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Target</p>
                          <p className="text-sm font-medium text-gray-700">
                            {goal.currentValue}/{goal.targetValue} {goal.unit}
                          </p>
                        </div>
                      </div>

                      {goal.deadline && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Deadline</p>
                          <p className="text-sm text-gray-700">
                            {goal.deadline.toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-3 w-3" />
                        <span>Coach: {goal.coachId ? '1' : 'Unassigned'}</span>
                        <span>•</span>
                        <span>Leads: {goal.leadIds?.length || 0}</span>
                        <span>•</span>
                        <span>Members: {goal.memberIds?.length || 0}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSelectGoal}
                  disabled={!selectedGoalId}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Join as Member
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};