
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamOverview } from './TeamOverview';
import { IndividualPerformance } from './IndividualPerformance';
import { IndividualDetailsSection } from './team/IndividualDetailsSection';
import { Users, User, UserCheck, Lock } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTeamDataRealtime } from '@/hooks/useTeamDataRealtime';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useIsMobile } from '@/hooks/use-mobile';

export const ManagerDashboard = () => {
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState('team');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [viewMode, setViewMode] = useState<'summary' | 'dashboard'>('summary');
  const { profile } = useUserProfile();
  const isMobile = useIsMobile();
  const {
    teamData,
    isLoading
  } = useTeamDataRealtime();

  // Check if user has access to individual detail tab (only managers and admins)
  const canAccessIndividualDetail = profile?.role === 'manager' || profile?.role === 'admin';

  // Handle navigation from TeamOverview
  useEffect(() => {
    const state = location.state as any;
    if (state?.selectedTab) {
      // Only allow individual-detail tab if user has permission
      if (state.selectedTab === 'individual-detail' && !canAccessIndividualDetail) {
        setSelectedTab('individual');
      } else {
        setSelectedTab(state.selectedTab);
      }
      console.log('Navigated to tab:', state.selectedTab);
    }
    if (state?.selectedEmployee) {
      setSelectedEmployee(state.selectedEmployee);
      console.log('Selected employee:', state.selectedEmployee);
    }
    if (state?.viewMode) {
      setViewMode(state.viewMode);
      console.log('Set view mode from navigation:', state.viewMode);
    }
  }, [location.state, canAccessIndividualDetail]);

  const handleViewMemberDetails = (memberId: string) => {
    console.log('ManagerDashboard - handleViewMemberDetails called with:', memberId);
    if (canAccessIndividualDetail) {
      setSelectedEmployee(memberId);
      setViewMode('summary');
      setSelectedTab('individual-detail');
      console.log('ManagerDashboard - Set viewMode to summary for member:', memberId);
    }
  };

  const handleViewMemberDashboard = (memberId: string) => {
    console.log('ManagerDashboard - handleViewMemberDashboard called with:', memberId);
    if (canAccessIndividualDetail) {
      setSelectedEmployee(memberId);
      setViewMode('dashboard');
      setSelectedTab('individual-detail');
      console.log('ManagerDashboard - Set viewMode to dashboard for member:', memberId);
    }
  };

  // Clear selection when switching to team tab, but NOT when switching to individual tab
  const handleTabChange = (value: string) => {
    // Prevent access to individual-detail if user doesn't have permission
    if (value === 'individual-detail' && !canAccessIndividualDetail) {
      return;
    }
    
    setSelectedTab(value);
    if (value === 'team') {
      setSelectedEmployee('');
      setViewMode('summary');
      console.log('Cleared selection when switching to team tab');
    }
    // Don't clear selection when going to individual tab - let it work independently
  };

  // Log current state for debugging
  console.log('ManagerDashboard state:', {
    selectedTab,
    selectedEmployee,
    viewMode,
    userRole: profile?.role,
    canAccessIndividualDetail
  });

  // Helper function to get icon labels based on screen size
  const getTabLabel = (text: string, icon: React.ReactNode) => {
    if (isMobile) {
      return icon;
    }
    return (
      <span className="flex items-center gap-2">
        {icon}
        {text}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-3 sm:py-8 sm:px-4">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Our Team</h1>
        <p className="text-sm sm:text-base text-gray-600">Monitor team productivity</p>
      </div>

      <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
        <TabsList className={`w-full flex ${canAccessIndividualDetail ? 'grid-cols-3' : 'grid-cols-2'} lg:w-[600px] ${isMobile ? 'p-0.5' : 'p-1'}`}>
          <TabsTrigger 
            value="team" 
            className={`flex items-center justify-center ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-1.5 text-sm'}`}
          >
            {getTabLabel("Team Overview", <Users className="h-4 w-4" />)}
          </TabsTrigger>
          <TabsTrigger 
            value="individual" 
            className={`flex items-center justify-center ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-1.5 text-sm'}`}
          >
            {getTabLabel("Individual Overview", <User className="h-4 w-4" />)}
          </TabsTrigger>
          {canAccessIndividualDetail && (
            <TabsTrigger 
              value="individual-detail" 
              className={`flex items-center justify-center ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-1.5 text-sm'}`}
            >
              {getTabLabel("Individual Detail", <UserCheck className="h-4 w-4" />)}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="team">
          <TeamOverview 
            onViewMemberDetails={canAccessIndividualDetail ? handleViewMemberDetails : undefined} 
            onViewMemberDashboard={canAccessIndividualDetail ? handleViewMemberDashboard : undefined} 
          />
        </TabsContent>

        <TabsContent value="individual">
          <div>
            <Card className="mb-6">
              
            </Card>
            
            <IndividualPerformance preSelectedEmployee="" onEmployeeChange={employeeId => {
              console.log('Employee selected from Individual Performance tab:', employeeId);
            }} />
          </div>
        </TabsContent>

        {canAccessIndividualDetail && (
          <TabsContent value="individual-detail">
            {teamData ? (
              <div>
                <IndividualDetailsSection 
                  teamData={teamData} 
                  onViewMemberDetails={handleViewMemberDetails} 
                  onViewMemberDashboard={handleViewMemberDashboard} 
                  selectedMemberId={selectedEmployee} 
                  viewMode={viewMode} 
                />
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">
                    {isLoading ? 'Loading team data...' : 'No team data available'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
