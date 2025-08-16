import React, { useState } from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamWorkloadMonitoring } from "@/components/manager/TeamWorkloadMonitoring";
import { IndividualDetailsSection } from "@/components/team/IndividualDetailsSection";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useTeamDataRealtime } from "@/hooks/useTeamDataRealtime";

const Manager = () => {
  const [selectedTab, setSelectedTab] = useState("workload");
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  
  const { profile: currentUser } = useUserProfile();
  const { teamData, isLoading } = useTeamDataRealtime();

  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';

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

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor team workload and manage goal assignments
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="workload">Team Workload</TabsTrigger>
            <TabsTrigger value="individual-detail">Individual Detail</TabsTrigger>
          </TabsList>

          <TabsContent value="workload" className="space-y-6">
            <TeamWorkloadMonitoring 
              teamData={teamData}
              isLoading={isLoading}
              onSelectEmployee={setSelectedEmployee}
            />
          </TabsContent>

          <TabsContent value="individual-detail" className="space-y-6">
            <IndividualDetailsSection 
              teamData={teamData}
              selectedMemberId={selectedEmployee}
              onViewMemberDetails={setSelectedEmployee}
              onViewMemberDashboard={setSelectedEmployee}
              viewMode="summary"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Manager;