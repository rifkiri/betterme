
import React from 'react';
import { TeamSummaryCards } from './team/TeamSummaryCards';
import { OverdueItemsSection } from './team/OverdueItemsSection';
import { TeamPerformanceTable } from './team/TeamPerformanceTable';
import { TeamTrendsCard } from './team/TeamTrendsCard';
import { TeamMoodChart } from './team/TeamMoodChart';
import { TeamData } from '@/types/teamData';

// Mock team data with mood information
const teamData: TeamData = {
  totalMembers: 8,
  activeMembers: 7,
  teamStats: {
    habitsCompletionRate: 78,
    tasksCompletionRate: 85,
    outputsCompletionRate: 72,
    avgHabitStreak: 12,
    teamAverageMood: 7.2,
    teamMoodTrend: 'improving'
  },
  membersSummary: [
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'Senior Developer',
      habitsRate: 90,
      tasksRate: 95,
      outputsRate: 88,
      status: 'excellent',
      currentMood: 8,
      averageMood: 8.2,
      moodTrend: 'stable'
    },
    {
      id: '2',
      name: 'Mike Chen',
      role: 'Product Manager',
      habitsRate: 85,
      tasksRate: 78,
      outputsRate: 82,
      status: 'good',
      currentMood: 7,
      averageMood: 7.1,
      moodTrend: 'improving'
    },
    {
      id: '3',
      name: 'Emily Davis',
      role: 'Designer',
      habitsRate: 75,
      tasksRate: 88,
      outputsRate: 65,
      status: 'average',
      currentMood: 6,
      averageMood: 6.8,
      moodTrend: 'declining'
    },
    {
      id: '4',
      name: 'Alex Rodriguez',
      role: 'Developer',
      habitsRate: 60,
      tasksRate: 70,
      outputsRate: 55,
      status: 'needs-attention',
      currentMood: 5,
      averageMood: 6.2,
      moodTrend: 'declining'
    },
    {
      id: '5',
      name: 'Lisa Wang',
      role: 'QA Engineer',
      habitsRate: 88,
      tasksRate: 92,
      outputsRate: 78,
      status: 'good',
      currentMood: 8,
      averageMood: 7.9,
      moodTrend: 'stable'
    }
  ],
  overdueTasks: [
    {
      id: '1',
      title: 'API Documentation Update',
      assignee: 'Alex Rodriguez',
      priority: 'High',
      daysOverdue: 3,
      originalDueDate: '2024-05-28'
    },
    {
      id: '2',
      title: 'User Testing Report',
      assignee: 'Emily Davis',
      priority: 'Medium',
      daysOverdue: 1,
      originalDueDate: '2024-05-30'
    },
    {
      id: '3',
      title: 'Code Review Checklist',
      assignee: 'Mike Chen',
      priority: 'Low',
      daysOverdue: 2,
      originalDueDate: '2024-05-29'
    }
  ],
  overdueOutputs: [
    {
      id: '1',
      title: 'Q2 Marketing Campaign',
      assignee: 'Mike Chen',
      progress: 65,
      daysOverdue: 5,
      originalDueDate: '2024-05-26'
    },
    {
      id: '2',
      title: 'Mobile App Redesign',
      assignee: 'Emily Davis',
      progress: 40,
      daysOverdue: 2,
      originalDueDate: '2024-05-29'
    },
    {
      id: '3',
      title: 'Performance Optimization',
      assignee: 'Alex Rodriguez',
      progress: 30,
      daysOverdue: 4,
      originalDueDate: '2024-05-27'
    }
  ],
  overdueStats: {
    tasksCount: 3,
    outputsCount: 3,
    tasksTrend: 'up',
    outputsTrend: 'down',
    tasksChange: '+2',
    outputsChange: '-1'
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
