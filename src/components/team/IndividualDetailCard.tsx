
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TeamMember } from '@/types/teamData';
import { CheckCircle, Target, TrendingUp, Clock, Award, Monitor } from 'lucide-react';

interface IndividualDetailCardProps {
  member: TeamMember;
  onViewDetails?: (memberId: string) => void;
  onViewDashboard?: (memberId: string) => void;
  isSelected?: boolean;
}

export const IndividualDetailCard = ({ 
  member, 
  onViewDetails, 
  onViewDashboard, 
  isSelected 
}: IndividualDetailCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'average':
        return 'bg-yellow-100 text-yellow-800';
      case 'needs-attention':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAveragePerformance = () => {
    return Math.round((member.habitsRate + member.tasksRate + member.outputsRate) / 3);
  };

  const handleViewDetails = () => {
    console.log('View details clicked for member:', member.id);
    onViewDetails?.(member.id);
  };

  const handleViewDashboard = () => {
    console.log('View dashboard clicked for member:', member.id);
    onViewDashboard?.(member.id);
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-lg">{member.name}</CardTitle>
              <CardDescription>{member.role}</CardDescription>
            </div>
          </div>
          <Badge className={getStatusColor(member.status)}>
            {member.status.replace('-', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Performance */}
        <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{getAveragePerformance()}%</div>
          <div className="text-sm text-gray-600">Overall Performance</div>
        </div>

        {/* Individual Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Habits</span>
            </div>
            <div className="flex items-center space-x-2">
              <Progress value={member.habitsRate} className="w-16 h-2" />
              <span className="text-sm font-medium">{member.habitsRate}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Tasks</span>
            </div>
            <div className="flex items-center space-x-2">
              <Progress value={member.tasksRate} className="w-16 h-2" />
              <span className="text-sm font-medium">{member.tasksRate}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Outputs</span>
            </div>
            <div className="flex items-center space-x-2">
              <Progress value={member.outputsRate} className="w-16 h-2" />
              <span className="text-sm font-medium">{member.outputsRate}%</span>
            </div>
          </div>
        </div>

        {/* Action Buttons - Only show if user has access */}
        {(onViewDetails || onViewDashboard) && (
          <div className="space-y-2">
            {onViewDetails && (
              <button
                onClick={handleViewDetails}
                className="w-full px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors"
              >
                View Performance Summary
              </button>
            )}
            {onViewDashboard && (
              <button
                onClick={handleViewDashboard}
                className="w-full px-3 py-2 text-sm bg-green-50 hover:bg-green-100 text-green-600 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <Monitor className="h-4 w-4" />
                View Full Dashboard
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
