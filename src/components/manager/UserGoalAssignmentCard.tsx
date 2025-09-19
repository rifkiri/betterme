import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Target, UserCog, UserCheck, Users } from 'lucide-react';

interface UserGoalAssignment {
  userId: string;
  userName: string;
  email: string;
  assignments: Array<{
    goalId: string;
    goalTitle: string;
    role: 'coach' | 'lead' | 'member';
    progress: number;
  }>;
  totalGoals: number;
  roleBreakdown: {
    coach: number;
    lead: number;
    member: number;
  };
}

interface UserGoalAssignmentCardProps {
  assignment: UserGoalAssignment;
  onViewDetails?: (userId: string) => void;
}

const getRoleBadgeVariant = (role: 'coach' | 'lead' | 'member') => {
  switch (role) {
    case 'coach':
      return 'default';
    case 'lead':
      return 'secondary';
    case 'member':
      return 'outline';
    default:
      return 'outline';
  }
};

const getRoleIcon = (role: 'coach' | 'lead' | 'member') => {
  switch (role) {
    case 'coach':
      return <UserCog className="h-3 w-3" />;
    case 'lead':
      return <UserCheck className="h-3 w-3" />;
    case 'member':
      return <Users className="h-3 w-3" />;
    default:
      return <Users className="h-3 w-3" />;
  }
};

export const UserGoalAssignmentCard = ({ 
  assignment, 
  onViewDetails 
}: UserGoalAssignmentCardProps) => {
  const initials = assignment.userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* User Header */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{assignment.userName}</h3>
            <p className="text-xs text-gray-500">{assignment.email}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            <Target className="h-3 w-3 mr-1" />
            {assignment.totalGoals} {assignment.totalGoals === 1 ? 'Goal' : 'Goals'}
          </Badge>
        </div>

        {/* Role Distribution */}
        {assignment.totalGoals > 0 && (
          <div className="flex gap-2 mb-3">
            {assignment.roleBreakdown.coach > 0 && (
              <Badge variant="default" className="text-xs">
                <UserCog className="h-3 w-3 mr-1" />
                Coach ({assignment.roleBreakdown.coach})
              </Badge>
            )}
            {assignment.roleBreakdown.lead > 0 && (
              <Badge variant="secondary" className="text-xs">
                <UserCheck className="h-3 w-3 mr-1" />
                Lead ({assignment.roleBreakdown.lead})
              </Badge>
            )}
            {assignment.roleBreakdown.member > 0 && (
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                Member ({assignment.roleBreakdown.member})
              </Badge>
            )}
          </div>
        )}

        {/* Goals List */}
        <div className="space-y-2">
          {assignment.assignments.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No goals assigned</p>
          ) : (
            assignment.assignments.map((goal) => (
              <div key={goal.goalId} className="border-l-2 border-gray-200 pl-3 py-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {goal.goalTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getRoleBadgeVariant(goal.role)} className="text-xs">
                        {getRoleIcon(goal.role)}
                        <span className="ml-1">{goal.role}</span>
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {goal.progress}% complete
                      </span>
                    </div>
                  </div>
                  <Progress value={goal.progress} className="w-16 h-2" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* View Details Button */}
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(assignment.userId)}
            className="mt-3 w-full text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            View Employee Details →
          </button>
        )}
      </CardContent>
    </Card>
  );
};