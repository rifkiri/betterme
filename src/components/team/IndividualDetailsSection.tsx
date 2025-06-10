
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IndividualDetailCard } from './IndividualDetailCard';
import { IndividualPerformanceContent } from '../individual/IndividualPerformanceContent';
import { FullEmployeeDashboardView } from './FullEmployeeDashboardView';
import { TeamData } from '@/types/teamData';
import { Users } from 'lucide-react';
import { useEmployeeData } from '@/hooks/useEmployeeData';

interface IndividualDetailsSectionProps {
  teamData: TeamData;
  onViewMemberDetails?: (memberId: string) => void;
  onViewMemberDashboard?: (memberId: string) => void;
  selectedMemberId?: string;
  viewMode?: 'summary' | 'dashboard';
}

export const IndividualDetailsSection = ({ 
  teamData, 
  onViewMemberDetails, 
  onViewMemberDashboard,
  selectedMemberId,
  viewMode = 'summary'
}: IndividualDetailsSectionProps) => {
  const { employeeData, isLoading } = useEmployeeData();

  console.log('IndividualDetailsSection - selectedMemberId:', selectedMemberId);
  console.log('IndividualDetailsSection - viewMode:', viewMode);

  if (!teamData.membersSummary || teamData.membersSummary.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">No team members to display</p>
        </CardContent>
      </Card>
    );
  }

  // If a specific member is selected AND we explicitly want to show their details
  if (selectedMemberId && (viewMode === 'dashboard' || viewMode === 'summary')) {
    const selectedMember = teamData.membersSummary.find(member => member.id === selectedMemberId);
    const selectedEmployeeData = employeeData[selectedMemberId];

    console.log('Selected member found:', selectedMember?.name);
    console.log('Employee data loaded:', !!selectedEmployeeData);
    console.log('View mode is dashboard:', viewMode === 'dashboard');

    if (!selectedMember) {
      return (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Selected team member not found</p>
            <button
              onClick={() => onViewMemberDetails?.('')}
              className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              ← Back to All Team Members
            </button>
          </CardContent>
        </Card>
      );
    }

    if (isLoading) {
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Loading {selectedMember.name}'s Details
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Loading detailed performance data...</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!selectedEmployeeData) {
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {selectedMember.name}'s Details
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No detailed data available for {selectedMember.name}</p>
              <button
                onClick={() => onViewMemberDetails?.('')}
                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                ← Back to All Team Members
              </button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Show full dashboard view if viewMode is 'dashboard'
    if (viewMode === 'dashboard') {
      console.log('Rendering FullEmployeeDashboardView for:', selectedMember.name);
      return (
        <FullEmployeeDashboardView 
          employee={selectedEmployeeData}
          onBack={() => onViewMemberDetails?.('')}
        />
      );
    }

    // Show summary performance view (existing behavior)
    console.log('Rendering summary view for:', selectedMember.name);
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedMember.name}'s Performance Summary
            </CardTitle>
            <CardDescription>
              Detailed productivity overview including habits, tasks, outputs, and mood tracking
            </CardDescription>
          </CardHeader>
        </Card>

        <IndividualPerformanceContent employee={selectedEmployeeData} />

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => onViewMemberDetails?.('')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            ← Back to All Team Members
          </button>
          <button
            onClick={() => onViewMemberDashboard?.(selectedMemberId)}
            className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-md transition-colors"
          >
            View Full Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show all team members overview (when no specific member is selected or we want to show the grid)
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Individual Team Performance
          </CardTitle>
          <CardDescription>
            Click on any team member to view their detailed productivity overview
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamData.membersSummary.map((member) => (
          <IndividualDetailCard
            key={member.id}
            member={member}
            onViewDetails={onViewMemberDetails}
            onViewDashboard={onViewMemberDashboard}
            isSelected={member.id === selectedMemberId}
          />
        ))}
      </div>
    </div>
  );
};
