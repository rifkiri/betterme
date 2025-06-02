
import React, { useState, useEffect } from 'react';
import { TeamSummaryCards } from './team/TeamSummaryCards';
import { OverdueItemsSection } from './team/OverdueItemsSection';
import { TeamPerformanceTable } from './team/TeamPerformanceTable';
import { TeamTrendsCard } from './team/TeamTrendsCard';
import { TeamMoodChart } from './team/TeamMoodChart';
import { TeamData } from '@/types/teamData';
import { teamDataService } from '@/services/TeamDataService';

export const TeamOverview = () => {
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTeamData = () => {
      setIsLoading(true);
      try {
        const data = teamDataService.getCurrentManagerTeamData();
        setTeamData(data);
        console.log('Team data loaded:', data);
      } catch (error) {
        console.error('Failed to load team data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadTeamData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Loading team data...</p>
        </div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-500">No team data available.</p>
        </div>
      </div>
    );
  }

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
