import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Target, UserCog, UserCheck, Users } from 'lucide-react';
import { mapSubcategoryDatabaseToDisplay } from '@/utils/goalCategoryUtils';

interface UserGoalAssignment {
  userId: string;
  userName: string;
  email: string;
  assignments: Array<{
    goalId: string;
    goalTitle: string;
    role: 'coach' | 'lead' | 'member';
    progress: number;
    subcategory?: string;
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

  // Defensive filter: only show active goals (progress < 100)
  const activeAssignments = assignment.assignments.filter(g => g.progress < 100);
  const activeGoalsCount = activeAssignments.length;
  const activeRoleBreakdown = {
    coach: activeAssignments.filter(g => g.role === 'coach').length,
    lead: activeAssignments.filter(g => g.role === 'lead').length,
    member: activeAssignments.filter(g => g.role === 'member').length
  };

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
            <h3 className="font-medium text-foreground">{assignment.userName}</h3>
            <p className="text-xs text-muted-foreground">{assignment.email}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            <Target className="h-3 w-3 mr-1" />
            {activeGoalsCount} {activeGoalsCount === 1 ? 'Goal' : 'Goals'}
          </Badge>
        </div>

        {/* Role Distribution */}
        {activeGoalsCount > 0 && (
          <div className="flex gap-2 mb-3">
            {activeRoleBreakdown.coach > 0 && (
              <Badge variant="default" className="text-xs">
                <UserCog className="h-3 w-3 mr-1" />
                Coach ({activeRoleBreakdown.coach})
              </Badge>
            )}
            {activeRoleBreakdown.lead > 0 && (
              <Badge variant="secondary" className="text-xs">
                <UserCheck className="h-3 w-3 mr-1" />
                Lead ({activeRoleBreakdown.lead})
              </Badge>
            )}
            {activeRoleBreakdown.member > 0 && (
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                Member ({activeRoleBreakdown.member})
              </Badge>
            )}
          </div>
        )}

        {/* Goals List */}
        <div className="space-y-2">
          {activeAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No goals assigned</p>
          ) : (
            activeAssignments.map((goal) => (
              <div key={goal.goalId} className="border-l-2 border-muted pl-3 py-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {goal.goalTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant={getRoleBadgeVariant(goal.role)} className="text-xs">
                        {getRoleIcon(goal.role)}
                        <span className="ml-1">{goal.role}</span>
                      </Badge>
                      {goal.subcategory && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {mapSubcategoryDatabaseToDisplay(goal.subcategory)}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
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