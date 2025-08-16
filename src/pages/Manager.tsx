import React, { useState } from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IndividualDetailsSection } from "@/components/team/IndividualDetailsSection";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useTeamDataRealtime } from "@/hooks/useTeamDataRealtime";

const Manager = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [viewMode, setViewMode] = useState<'summary' | 'dashboard'>('summary');
  
  const { profile: currentUser } = useUserProfile();
  const { teamData, isLoading } = useTeamDataRealtime();

  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';

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

  if (!isManager) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNavigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Access Restricted</CardTitle>
              <CardDescription>You need manager permissions to access this page.</CardDescription>
            </CardHeader>
          </Card>
        </div>
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
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Manage individual team member details and performance
          </p>
        </div>

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
      </div>
    </div>
  );
};

export default Manager;