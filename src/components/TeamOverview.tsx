
import React from 'react';
import { TeamSummaryCards } from './team/TeamSummaryCards';
import { OverdueItemsSection } from './team/OverdueItemsSection';
import { TeamPerformanceTable } from './team/TeamPerformanceTable';
import { TeamTrendsCard } from './team/TeamTrendsCard';
import { TeamMoodChart } from './team/TeamMoodChart';
import { TeamData } from '@/types/teamData';

// Empty team data - will be populated from real data sources
const teamData: TeamData = {
  totalMembers: 0,
  activeMembers: 0,
  teamStats: {
    habitsCompletionRate: 0,
    tasksCompletionRate: 0,
    outputsCompletionRate: 0,
    avgHabitStreak: 0,
    teamAverageMood: 0,
    teamMoodTrend: 'stable'
  },
  membersSummary: [],
  overdueTasks: [],
  overdueOutputs: [],
  overdueStats: {
    tasksCount: 0,
    outputsCount: 0,
    tasksTrend: 'stable',
    outputsTrend: 'stable',
    tasksChange: '0',
    outputsChange: '0'
  }
};

export const TeamOverview = () => {
  return (
    <div className="space-y-6">
      <TeamSummaryCards teamData={teamData} />
      <TeamMoodChart teamData={teamData} />
      <OverdueItemsSection teamData={teamData} />
      <TeamPerformanceTable teamData={teamData} />
      <TeamTrendsCard teamData={teamData} />
    </div>
  );
};
