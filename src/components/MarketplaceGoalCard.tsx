import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Goal, GoalAssignment } from '@/types/productivity';
import { Briefcase, Users, User, Calendar, TrendingUp, UserPlus, CheckCircle } from 'lucide-react';
import { mapSubcategoryDatabaseToDisplay } from '@/utils/goalCategoryUtils';
import { format } from 'date-fns';

interface MarketplaceGoalCardProps {
  goal: Goal;
  assignments: GoalAssignment[];
  availableUsers: Array<{ id: string; name: string; role: string }>;
  currentUserId?: string;
  isJoined: boolean;
  onJoin: (goalId: string, role?: 'coach' | 'lead' | 'member') => void;
  onViewDetails: (goal: Goal) => void;
}

export const MarketplaceGoalCard: React.FC<MarketplaceGoalCardProps> = ({
  goal,
  assignments,
  availableUsers,
  currentUserId,
  isJoined,
  onJoin,
  onViewDetails
}) => {
  const [selectedRole, setSelectedRole] = useState<'coach' | 'lead' | 'member'>('member');
  const [isJoining, setIsJoining] = useState(false);

  const goalAssignments = assignments.filter(a => a.goalId === goal.id);
  const coach = goalAssignments.find(a => a.role === 'coach');
  const lead = goalAssignments.find(a => a.role === 'lead');
  const members = goalAssignments.filter(a => a.role === 'member');
  const totalTeamSize = goalAssignments.length;

  // Check which roles are available
  const isCoachAvailable = !coach;
  const isLeadAvailable = !lead;
  const isUserOwnGoal = goal.userId === currentUserId || goal.createdBy === currentUserId;

  const handleQuickJoin = async () => {
    if (!selectedRole) {
      console.error('[MarketplaceGoalCard] No role selected for joining');
      return;
    }
    
    console.log('[MarketplaceGoalCard] Joining goal with role:', selectedRole);
    setIsJoining(true);
    try {
      await onJoin(goal.id, selectedRole);
    } catch (error) {
      console.error('[MarketplaceGoalCard] Error joining goal:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleViewDetails = () => {
    console.log('[MarketplaceGoalCard] Opening details for goal:', {
      id: goal.id,
      title: goal.title,
      visibility: goal.visibility,
      category: goal.category
    });
    onViewDetails(goal);
  };

  const progressColor = goal.progress >= 80 ? 'bg-green-500' : 
                       goal.progress >= 50 ? 'bg-yellow-500' : 'bg-blue-500';

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 relative overflow-hidden">
      {/* Status Badges */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        {isUserOwnGoal && (
          <Badge className="bg-primary text-primary-foreground">
            Your Goal
          </Badge>
        )}
        {isJoined && !isUserOwnGoal && (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Joined
          </Badge>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-lg line-clamp-1">{goal.title}</CardTitle>
            </div>
            {goal.subcategory && (
              <Badge variant="outline" className="text-xs bg-white border-blue-200 text-blue-700">
                {mapSubcategoryDatabaseToDisplay(goal.subcategory)}
              </Badge>
            )}
          </div>
        </div>
        {goal.description && (
          <CardDescription className="line-clamp-2 mt-2">{goal.description}</CardDescription>
        )}
        {/* Creator Info */}
        <div className="text-sm text-muted-foreground mt-2">
          Created by: {availableUsers.find(u => u.id === (goal.createdBy || goal.userId))?.name || 'Unknown'}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium">{goal.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${progressColor}`}
              style={{ width: `${Math.min(goal.progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Goal Metadata */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {goal.deadline && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600">
                {format(goal.deadline, 'MMM d, yyyy')}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-gray-400" />
            <span className="text-gray-600">
              {totalTeamSize} {totalTeamSize === 1 ? 'member' : 'members'}
            </span>
          </div>
        </div>

        {/* Team Composition */}
        <div className="space-y-2 pt-2 border-t">
          <div className="text-xs font-medium text-gray-700">Team Composition</div>
          
          {/* Team Avatars */}
          <div className="flex -space-x-2">
            {goalAssignments.slice(0, 5).map((assignment) => {
              const user = availableUsers.find(u => u.id === assignment.userId);
              return (
                <Avatar key={assignment.id} className="h-8 w-8 border-2 border-white">
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-800">
                    {user ? getInitials(user.name) : '?'}
                  </AvatarFallback>
                </Avatar>
              );
            })}
            {totalTeamSize > 5 && (
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 border-2 border-white">
                <span className="text-xs text-gray-600">+{totalTeamSize - 5}</span>
              </div>
            )}
          </div>

          {/* Roles Info */}
          <div className="space-y-1 text-xs">
            {coach && (
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs h-5">Coach</Badge>
                <span className="text-gray-600">
                  {availableUsers.find(u => u.id === coach.userId)?.name || 'Unknown'}
                </span>
              </div>
            )}
            {lead && (
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs h-5">Lead</Badge>
                <span className="text-gray-600">
                  {availableUsers.find(u => u.id === lead.userId)?.name || 'Unknown'}
                </span>
              </div>
            )}
            {members.length > 0 && (
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs h-5">Members</Badge>
                <span className="text-gray-600">{members.length}</span>
              </div>
            )}
          </div>

          {/* Available Roles */}
          {(isCoachAvailable || isLeadAvailable) && !isJoined && !isUserOwnGoal && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-green-600 font-medium">Open roles:</span>
              <div className="flex gap-1">
                {isCoachAvailable && <Badge className="text-xs bg-green-100 text-green-700">Coach</Badge>}
                {isLeadAvailable && <Badge className="text-xs bg-green-100 text-green-700">Lead</Badge>}
                <Badge className="text-xs bg-green-100 text-green-700">Member</Badge>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button 
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleViewDetails}
          >
            View Details
          </Button>
          
          {!isJoined && !isUserOwnGoal && (
            <>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as 'coach' | 'lead' | 'member')}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isCoachAvailable && <SelectItem value="coach">Coach</SelectItem>}
                  {isLeadAvailable && <SelectItem value="lead">Lead</SelectItem>}
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleQuickJoin}
                disabled={isJoining}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Join
              </Button>
            </>
          )}
          
          {isJoined && !isUserOwnGoal && (
            <Button 
              size="sm"
              variant="outline"
              className="flex-1"
              disabled
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Already Joined
            </Button>
          )}
          
          {isUserOwnGoal && (
            <Button 
              size="sm"
              variant="secondary"
              className="flex-1"
              disabled
            >
              <User className="h-4 w-4 mr-1" />
              Your Goal
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};