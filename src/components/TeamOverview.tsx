
import React, { useState, useEffect } from 'react';
import { TeamSummaryCards } from './team/TeamSummaryCards';
import { OverdueItemsSection } from './team/OverdueItemsSection';
import { TeamPerformanceTable } from './team/TeamPerformanceTable';
import { TeamTrendsCard } from './team/TeamTrendsCard';
import { TeamMoodChart } from './team/TeamMoodChart';
import { TeamData } from '@/types/teamData';
import { teamDataService } from '@/services/TeamDataService';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

export const TeamOverview = () => {
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTeamData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Loading team data...');
        const data = await teamDataService.getCurrentManagerTeamData();
        setTeamData(data);
        console.log('Team data loaded successfully:', data);
      } catch (error) {
        console.error('Failed to load team data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load team data');
        toast.error('Failed to load team data. Please try again.');
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
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
              <p className="text-gray-500">Loading team data from database...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
              <div>
                <p className="text-red-600 font-medium">Error loading team data</p>
                <p className="text-gray-500 text-sm mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!teamData || teamData.totalMembers === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Users className="h-8 w-8 mx-auto text-gray-400" />
              <div>
                <p className="text-gray-600 font-medium">No team members found</p>
                <p className="text-gray-500 text-sm mt-1">Add team members to see team performance data</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
