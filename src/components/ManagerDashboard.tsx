import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamOverview } from './TeamOverview';
import { IndividualPerformance } from './IndividualPerformance';
import { IndividualDetailsSection } from './team/IndividualDetailsSection';
import { Users, User, UserCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTeamDataRealtime } from '@/hooks/useTeamDataRealtime';
export const ManagerDashboard = () => {
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState('team');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [viewMode, setViewMode] = useState<'summary' | 'dashboard'>('summary');
  const {
    teamData,
    isLoading
  } = useTeamDataRealtime();

  // Handle navigation from TeamOverview
  useEffect(() => {
    const state = location.state as any;
    if (state?.selectedTab) {
      setSelectedTab(state.selectedTab);
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
  }, [location.state]);
  const handleViewMemberDetails = (memberId: string) => {
    console.log('ManagerDashboard - handleViewMemberDetails called with:', memberId);
    setSelectedEmployee(memberId);
    setViewMode('summary');
    setSelectedTab('individual-detail');
    console.log('ManagerDashboard - Set viewMode to summary for member:', memberId);
  };
  const handleViewMemberDashboard = (memberId: string) => {
    console.log('ManagerDashboard - handleViewMemberDashboard called with:', memberId);
    setSelectedEmployee(memberId);
    setViewMode('dashboard');
    setSelectedTab('individual-detail');
    console.log('ManagerDashboard - Set viewMode to dashboard for member:', memberId);
  };

  // Clear selection when switching to team tab, but NOT when switching to individual tab
  const handleTabChange = (value: string) => {
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
    viewMode
  });
  return <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Team</h1>
        <p className="text-gray-600">Monitor team productivity and individual performance</p>
      </div>

      <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Overview
          </TabsTrigger>
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Individual Detail
          </TabsTrigger>
          <TabsTrigger value="individual-detail" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Individual Detail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team">
          <TeamOverview onViewMemberDetails={handleViewMemberDetails} onViewMemberDashboard={handleViewMemberDashboard} />
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

        <TabsContent value="individual-detail">
          {teamData ? <div>
              {selectedEmployee && <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Showing {viewMode === 'dashboard' ? 'full dashboard' : 'performance summary'} for: {teamData.membersSummary.find(m => m.id === selectedEmployee)?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    View mode: {viewMode} | Selected ID: {selectedEmployee}
                  </p>
                </div>}
              <IndividualDetailsSection teamData={teamData} onViewMemberDetails={handleViewMemberDetails} onViewMemberDashboard={handleViewMemberDashboard} selectedMemberId={selectedEmployee} viewMode={viewMode} />
            </div> : <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">
                  {isLoading ? 'Loading team data...' : 'No team data available'}
                </p>
              </CardContent>
            </Card>}
        </TabsContent>
      </Tabs>
    </div>;
};