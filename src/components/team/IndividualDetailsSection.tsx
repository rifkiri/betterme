
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IndividualDetailCard } from './IndividualDetailCard';
import { TeamData } from '@/types/teamData';
import { Users } from 'lucide-react';

interface IndividualDetailsSectionProps {
  teamData: TeamData;
  onViewMemberDetails?: (memberId: string) => void;
}

export const IndividualDetailsSection = ({ teamData, onViewMemberDetails }: IndividualDetailsSectionProps) => {
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Individual Team Performance
          </CardTitle>
          <CardDescription>
            Detailed productivity overview for each team member
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamData.membersSummary.map((member) => (
          <IndividualDetailCard
            key={member.id}
            member={member}
            onViewDetails={onViewMemberDetails}
          />
        ))}
      </div>
    </div>
  );
};
