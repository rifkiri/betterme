import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCog, UserCheck, User, Target, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { Goal } from '@/types/productivity';
import { GoalAssignment } from '@/types/productivity';
import { toast } from 'sonner';

interface JoinGoalDialogProps {
  availableGoals: Goal[];
  availableUsers?: Array<{ id: string; name: string; role: string }>;
  currentUserId?: string;
  assignments: GoalAssignment[];
  onJoinGoal: (goalId: string, role: 'coach' | 'lead' | 'member') => void;
}

export const JoinGoalDialog = ({ 
  availableGoals, 
  availableUsers = [],
  currentUserId,
  assignments,
  onJoinGoal 
}: JoinGoalDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'coach' | 'lead' | 'member'>('member');

  // Debug logging for JoinGoalDialog props
  console.log('JoinGoalDialog received props:', {
    availableGoalsCount: availableGoals.length,
    assignmentsCount: assignments.length,
    currentUserId,
    availableUsersCount: availableUsers.length
  });

  const handleJoin = async () => {
    console.log('JoinGoalDialog handleJoin called:', { selectedGoal, selectedRole, currentUserId });
    
    if (!currentUserId) {
      toast.error('Authentication required to join goal');
      return;
    }

    if (!selectedGoal) {
      toast.error('Please select a goal to join');
      return;
    }

    const goal = availableGoals.find(g => g.id === selectedGoal);
    if (!goal) {
      toast.error('Goal not found');
      return;
    }

    console.log('Goal found for joining:', { id: goal.id, title: goal.title, category: goal.category });

    // Validate role availability using assignments data
    const goalAssignments = assignments.filter(a => a.goalId === selectedGoal);
    
    if (selectedRole === 'coach' && goalAssignments.some(a => a.role === 'coach')) {
      toast.error('Coach role is already taken');
      return;
    }

    if (selectedRole === 'lead' && goalAssignments.some(a => a.role === 'lead')) {
      toast.error('Lead role is already taken');
      return;
    }

    try {
      console.log('Calling onJoinGoal with:', { goalId: selectedGoal, role: selectedRole });
      await onJoinGoal(selectedGoal, selectedRole);
      
      console.log('onJoinGoal completed successfully');
      setOpen(false);
      setSelectedGoal('');
      setSelectedRole('member');
      // Note: Success toast is already shown in useGoalCollaboration
    } catch (error) {
      console.error('Error in handleJoin:', error);
      // Error toast is already shown in useGoalCollaboration
    }
  };

  const getAvailableRoles = (goal: Goal) => {
    const roles = [];
    const goalAssignments = assignments.filter(a => a.goalId === goal.id);
    
    // Coach role available if no coach assigned for this goal
    if (!goalAssignments.some(a => a.role === 'coach')) {
      roles.push('coach');
    }
    
    // Lead role available if no leads assigned for this goal
    if (!goalAssignments.some(a => a.role === 'lead')) {
      roles.push('lead');
    }
    
    // Member role always available
    roles.push('member');
    
    return roles;
  };

  const getUserName = (userId: string) => {
    const user = availableUsers.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getSelectedGoalData = () => {
    return availableGoals.find(g => g.id === selectedGoal);
  };

  const selectedGoalData = getSelectedGoalData();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Users className="h-4 w-4 mr-2" />
          Join Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Join Work Goal
          </DialogTitle>
          <DialogDescription>
            Select an existing work goal to join and contribute to its completion. Choose your role based on availability.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Goal Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Goal</label>
            <Select value={selectedGoal} onValueChange={setSelectedGoal}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a work goal to join" />
              </SelectTrigger>
              <SelectContent>
                {availableGoals.map(goal => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.title} ({goal.progress}% complete)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Goal Details */}
          {selectedGoalData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{selectedGoalData.title}</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {selectedGoalData.progress}% Complete
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedGoalData.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedGoalData.description}
                  </p>
                )}
                
                {selectedGoalData.deadline && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Deadline: {format(selectedGoalData.deadline, 'PPP')}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>Progress: {selectedGoalData.progress}%</span>
                </div>

                {/* Current Team Composition */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Current Team</h4>
                  <div className="space-y-2">
                    {/* Coach */}
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Coach:</span>
                      {(() => {
                        const coachAssignment = assignments.find(a => a.goalId === selectedGoalData.id && a.role === 'coach');
                        return coachAssignment ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {getUserName(coachAssignment.userId)}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Vacant</span>
                        );
                      })()}
                    </div>

                    {/* Lead */}
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Lead:</span>
                      {(() => {
                        const leadAssignment = assignments.find(a => a.goalId === selectedGoalData.id && a.role === 'lead');
                        return leadAssignment ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {getUserName(leadAssignment.userId)}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Vacant</span>
                        );
                      })()}
                    </div>

                    {/* Members */}
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Members:</span>
                      {(() => {
                        const memberAssignments = assignments.filter(a => a.goalId === selectedGoalData.id && a.role === 'member');
                        return memberAssignments.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {memberAssignments.map(assignment => (
                              <Badge key={assignment.id} variant="secondary" className="bg-purple-100 text-purple-800">
                                {getUserName(assignment.userId)}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Role Selection */}
          {selectedGoalData && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Your Role</label>
              <Select value={selectedRole} onValueChange={(value: 'coach' | 'lead' | 'member') => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your role" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles(selectedGoalData).map(role => (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        {role === 'coach' && <UserCog className="h-4 w-4 text-blue-600" />}
                        {role === 'lead' && <UserCheck className="h-4 w-4 text-green-600" />}
                        {role === 'member' && <User className="h-4 w-4 text-purple-600" />}
                        <span className="capitalize">{role}</span>
                        {role === 'coach' && <span className="text-xs text-muted-foreground">(Guides & mentors)</span>}
                        {role === 'lead' && <span className="text-xs text-muted-foreground">(Leads execution)</span>}
                        {role === 'member' && <span className="text-xs text-muted-foreground">(Contributes to tasks)</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* No Goals Available */}
          {availableGoals.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium text-lg mb-2">No Goals Available</h3>
                <p className="text-sm text-muted-foreground">
                  There are currently no work goals available to join. Work goals will appear here when they are created by other team members.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleJoin} 
              disabled={!selectedGoal || availableGoals.length === 0}
            >
              Join as {selectedRole}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};