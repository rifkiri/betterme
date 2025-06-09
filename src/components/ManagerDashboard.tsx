
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamOverview } from './TeamOverview';
import { IndividualPerformance } from './IndividualPerformance';
import { Users, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const ManagerDashboard = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setCurrentUser(profile);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const isTeamMember = currentUser?.role === 'team-member';
  const isManager = currentUser?.role === 'manager';
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Team</h1>
        <p className="text-gray-600">
          {isTeamMember 
            ? "View your team's productivity and performance" 
            : "Monitor team productivity and individual performance"
          }
        </p>
      </div>

      {isTeamMember ? (
        // Team members only see the team overview
        <TeamOverview />
      ) : (
        // Managers and admins see both tabs
        <Tabs defaultValue="team" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Overview
            </TabsTrigger>
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Individual Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team">
            <TeamOverview />
          </TabsContent>

          <TabsContent value="individual">
            <IndividualPerformance />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
