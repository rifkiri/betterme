import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamOverview } from './TeamOverview';
import { IndividualPerformance } from './IndividualPerformance';
import { Users, User } from 'lucide-react';
import { PageHeader } from '@/components/ui/standardized';

export const TeamDashboard = () => {
  const [selectedTab, setSelectedTab] = useState('team');

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    console.log('TeamDashboard - switched to tab:', value);
  };

  console.log('TeamDashboard state:', {
    selectedTab
  });

  return (
    <div className="max-w-full mx-auto p-1 sm:p-2 lg:p-4">
      <PageHeader 
        title="Our Team" 
        subtitle="Monitor team productivity and performance" 
      />

      <Tabs defaultValue={selectedTab} value={selectedTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="flex w-full h-auto p-1 bg-gray-100 rounded-lg overflow-x-auto">
          <TabsTrigger 
            value="team" 
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap flex-shrink-0"
          >
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Team Overview</span>
            <span className="sm:hidden">Team</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="individual" 
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap flex-shrink-0"
          >
            <User className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Individual Overview</span>
            <span className="sm:hidden">Individual</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-4 sm:mt-6">
          <TeamOverview />
        </TabsContent>

        <TabsContent value="individual" className="mt-4 sm:mt-6">
          <div>
            <Card className="mb-6">
              
            </Card>
            
            <IndividualPerformance preSelectedEmployee="" onEmployeeChange={employeeId => {
              console.log('Employee selected from Individual Performance tab:', employeeId);
            }} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};