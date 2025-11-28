
import React from 'react';
import { Users, Target, CheckCircle, TrendingUp } from 'lucide-react';
import { StatCard, DashboardGrid } from '@/components/ui/standardized';
import { TeamData } from '@/types/teamData';

interface TeamSummaryCardsProps {
  teamData: TeamData;
}

/**
 * TeamSummaryCards component - refactored to use standardized StatCard components
 * Provides consistent stat display across team dashboard
 */
export const TeamSummaryCards = ({ teamData }: TeamSummaryCardsProps) => {
  return (
    <DashboardGrid columns={4} gap="md">
      <StatCard
        title="Team Members"
        value={`${teamData.activeMembers}/${teamData.totalMembers}`}
        description="Active this week"
        icon={Users}
        variant="default"
      />

      <StatCard
        title="Habits Completion"
        value={`${teamData.teamStats.habitsCompletionRate}%`}
        description="Team average"
        icon={Target}
        variant="info"
      />

      <StatCard
        title="Tasks Completion"
        value={`${teamData.teamStats.tasksCompletionRate}%`}
        description="This week"
        icon={CheckCircle}
        variant="success"
      />

      <StatCard
        title="Outputs Completion"
        value={`${teamData.teamStats.outputsCompletionRate}%`}
        description="Bi-weekly outputs"
        icon={TrendingUp}
        variant="gradient"
      />
    </DashboardGrid>
  );
};
