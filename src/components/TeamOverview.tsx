
import React from 'react';
import { TeamSummaryCards } from './team/TeamSummaryCards';
import { OverdueItemsSection } from './team/OverdueItemsSection';
import { TeamPerformanceTable } from './team/TeamPerformanceTable';
import { TeamTrendsCard } from './team/TeamTrendsCard';
import { TeamMoodChart } from './team/TeamMoodChart';
import { IndividualDetailsSection } from './team/IndividualDetailsSection';
import { useTeamDataRealtime } from '@/hooks/useTeamDataRealtime';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Users, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TeamOverviewProps {
  onViewMemberDetails?: (memberId: string) => void;
  onViewMemberDashboard?: (memberId: string) => void;
}

export const TeamOverview = ({ onViewMemberDetails, onViewMemberDashboard }: TeamOverviewProps) => {
  const { teamData, isLoading, error, lastUpdated, manualRefresh } = useTeamDataRealtime();
  const { profile } = useUserProfile();
  const navigate = useNavigate();

  // Check if user has access to individual detail features
  const canAccessIndividualDetail = profile?.role === 'manager' || profile?.role === 'admin';

  const handleViewMemberDetails = (memberId: string) => {
    console.log('TeamOverview - handleViewMemberDetails called with:', memberId);
    if (!canAccessIndividualDetail) return;
    
    if (onViewMemberDetails) {
      onViewMemberDetails(memberId);
    } else {
      // Navigate to individual detail tab with the selected member
      navigate('/manager', { state: { selectedTab: 'individual-detail', selectedEmployee: memberId } });
    }
  };

  const handleViewMemberDashboard = (memberId: string) => {
    console.log('TeamOverview - handleViewMemberDashboard called with:', memberId);
    if (!canAccessIndividualDetail) return;
    
    if (onViewMemberDashboard) {
      onViewMemberDashboard(memberId);
    } else {
      // Navigate to individual detail tab with dashboard view mode
      navigate('/manager', { 
        state: { 
          selectedTab: 'individual-detail', 
          selectedEmployee: memberId,
          viewMode: 'dashboard'
        } 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
              <p className="text-gray-500">Loading team data...</p>
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
              <Button onClick={manualRefresh} variant="outline" className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
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
              <Button onClick={manualRefresh} variant="outline" className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with manual refresh and last updated info */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {lastUpdated && (
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
        <Button 
          onClick={manualRefresh} 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <TeamSummaryCards teamData={teamData} />
      <TeamMoodChart teamData={teamData} />
      
      {/* Individual Details Section with role-based access */}
      <IndividualDetailsSection 
        teamData={teamData} 
        onViewMemberDetails={canAccessIndividualDetail ? handleViewMemberDetails : undefined}
        onViewMemberDashboard={canAccessIndividualDetail ? handleViewMemberDashboard : undefined}
      />
      
      <OverdueItemsSection teamData={teamData} />
      <TeamPerformanceTable teamData={teamData} />
      <TeamTrendsCard teamData={teamData} />
    </div>
  );
};
