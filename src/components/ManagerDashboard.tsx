
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamOverview } from './TeamOverview';
import { IndividualPerformance } from './IndividualPerformance';
import { Users, User, BarChart3 } from 'lucide-react';

export const ManagerDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manager Dashboard</h1>
        <p className="text-gray-600">Monitor team productivity and individual performance</p>
      </div>

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Overview
          </TabsTrigger>
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Individual Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team">
          <TeamOverview />
        </TabsContent>

        <TabsContent value="individual">
          <IndividualPerformance />
        </TabsContent>
      </Tabs>
    </div>
  );
};
