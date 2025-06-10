
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IndividualDetailCard } from './IndividualDetailCard';
import { TeamData } from '@/types/teamData';
import { Users } from 'lucide-react';

interface IndividualDetailsSectionProps {
  teamData: TeamData;
  onViewMemberDetails?: (memberId: string) => void;
  selectedMemberId?: string;
}

export const IndividualDetailsSection = ({ 
  teamData, 
  onViewMemberDetails, 
  selectedMemberId 
}: IndividualDetailsSectionProps) => {
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

  // If a specific member is selected, show only that member
  const membersToShow = selectedMemberId 
    ? teamData.membersSummary.filter(member => member.id === selectedMemberId)
    : teamData.membersSummary;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {selectedMemberId ? 'Individual Team Member Detail' : 'Individual Team Performance'}
          </CardTitle>
          <CardDescription>
            {selectedMemberId 
              ? 'Detailed productivity overview for the selected team member'
              : 'Detailed productivity overview for each team member'
            }
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {membersToShow.map((member) => (
          <IndividualDetailCard
            key={member.id}
            member={member}
            onViewDetails={onViewMemberDetails}
            isSelected={member.id === selectedMemberId}
          />
        ))}
      </div>

      {selectedMemberId && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => onViewMemberDetails?.('')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            ← Back to All Team Members
          </button>
        </div>
      )}
    </div>
  );
};
