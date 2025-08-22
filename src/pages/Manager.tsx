import React, { useState } from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { IndividualDetailsSection } from "@/components/team/IndividualDetailsSection";
import { TeamWorkloadMonitoring } from "@/components/manager/TeamWorkloadMonitoring";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useTeamDataRealtime } from "@/hooks/useTeamDataRealtime";
import { Target, Users } from "lucide-react";

const Manager = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [viewMode, setViewMode] = useState<'summary' | 'dashboard'>('summary');
  const [activeTab, setActiveTab] = useState<'workload' | 'individual'>('workload');
  
  const { profile: currentUser, isLoading: profileLoading } = useUserProfile();
  const { teamData, isLoading } = useTeamDataRealtime();

  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';

  console.log('Manager page - Profile loading state:', {
    profileLoading,
    currentUser: currentUser ? { id: currentUser.id, role: currentUser.role } : null,
    isManager
  });

  const handleViewMemberDetails = (memberId: string) => {
    console.log('Manager - handleViewMemberDetails called with:', memberId);
    setSelectedEmployee(memberId);
    setViewMode('summary');
    console.log('Manager - Set viewMode to summary for member:', memberId);
  };

  const handleViewMemberDashboard = (memberId: string) => {
    console.log('Manager - handleViewMemberDashboard called with:', memberId);
    setSelectedEmployee(memberId);
    setViewMode('dashboard');
    console.log('Manager - Set viewMode to dashboard for member:', memberId);
  };

  const handleSelectEmployee = (employeeId: string) => {
    console.log('Manager - handleSelectEmployee called with:', employeeId);
    setSelectedEmployee(employeeId);
    setViewMode('summary');
    setActiveTab('individual');
    console.log('Manager - Switched to Individual Details tab for employee:', employeeId);
  };

  // Show loading state while profile is loading
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNavigation />
        <Card>
          <CardContent className="text-center py-8">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-spin">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </div>
              <p className="text-gray-600">Loading user profile...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Restrict access to managers and admins only (only after profile is loaded)
  if (!isManager) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNavigation />
        <Card>
          <CardContent className="text-center py-8">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
              <p className="text-gray-600">
                You need manager or admin permissions to access this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('Manager state:', {
    selectedEmployee,
    viewMode,
    hasTeamData: !!teamData,
    isLoading
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <AppNavigation />
      
      <div className="max-w-full mx-auto p-1 sm:p-2 lg:p-4">
        <div className="text-center mb-2 sm:mb-4 px-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Manager Dashboard
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm lg:text-base">
            Monitor team performance and individual progress
          </p>
        </div>
      
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'workload' | 'individual')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-lg p-1">
            <TabsTrigger 
              value="workload" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline-flex">Team Workload</span>
            </TabsTrigger>
            <TabsTrigger 
              value="individual" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline-flex">Individual Details</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workload" className="mt-4">
            {teamData ? (
              <TeamWorkloadMonitoring 
                teamData={teamData} 
                isLoading={isLoading}
                onSelectEmployee={handleSelectEmployee}
              />
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

          <TabsContent value="individual" className="mt-4">
            {teamData ? (
              <IndividualDetailsSection 
                teamData={teamData} 
                onViewMemberDetails={handleViewMemberDetails} 
                onViewMemberDashboard={handleViewMemberDashboard} 
                selectedMemberId={selectedEmployee} 
                viewMode={viewMode} 
              />
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
        </Tabs>
      </div>
    </div>
  );
};

export default Manager;