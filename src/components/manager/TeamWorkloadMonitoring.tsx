import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Target, User, UserCheck, UserCog } from 'lucide-react';

interface TeamWorkloadMonitoringProps {
  teamData: any;
  isLoading: boolean;
  onSelectEmployee: (employeeId: string) => void;
}

export const TeamWorkloadMonitoring = ({ 
  teamData, 
  isLoading, 
  onSelectEmployee 
}: TeamWorkloadMonitoringProps) => {
  const [viewMode, setViewMode] = useState<'members' | 'goals' | 'coach' | 'lead' | 'member'>('members');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Workload Monitoring</CardTitle>
          <CardDescription>Loading team data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!teamData || !teamData.members) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Workload Monitoring</CardTitle>
          <CardDescription>No team data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Team Workload Monitoring
          </CardTitle>
          <CardDescription>
            Monitor team workload across different views and roles
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="members" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            By Members
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            By Goals
          </TabsTrigger>
          <TabsTrigger value="coach" className="flex items-center gap-1">
            <UserCog className="h-3 w-3" />
            By Coach
          </TabsTrigger>
          <TabsTrigger value="lead" className="flex items-center gap-1">
            <UserCheck className="h-3 w-3" />
            By Lead
          </TabsTrigger>
          <TabsTrigger value="member" className="flex items-center gap-1">
            <User className="h-3 w-3" />
            By Member
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members View</CardTitle>
              <CardDescription>Overview of each team member's workload and role distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamData.members.map((member: any) => (
                  <Card key={member.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">{member.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Work Goals:</span>
                        <span className="font-medium">0</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Personal Goals:</span>
                        <span className="font-medium">0</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Role Distribution:</span>
                        <div className="flex gap-1">
                          <Badge variant="secondary" className="text-xs px-1">C:0</Badge>
                          <Badge variant="secondary" className="text-xs px-1">L:0</Badge>
                          <Badge variant="secondary" className="text-xs px-1">M:0</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => onSelectEmployee(member.id)}
                    >
                      View Details
                    </Button>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Goals View</CardTitle>
              <CardDescription>Work goals with their assigned team members and roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No work goals created yet.</p>
                <p className="text-sm mt-1">Create work goals to see them here with their role assignments.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coach" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coach View</CardTitle>
              <CardDescription>Team members in coaching roles and their responsibilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <UserCog className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No coaching assignments yet.</p>
                <p className="text-sm mt-1">Assign coaches to work goals to see coaching workload.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lead" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lead View</CardTitle>
              <CardDescription>Team members in leadership roles across goals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No leadership assignments yet.</p>
                <p className="text-sm mt-1">Assign leads to work goals to see leadership workload.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="member" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Member View</CardTitle>
              <CardDescription>Team members executing goals and their workload</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No member assignments yet.</p>
                <p className="text-sm mt-1">Assign members to work goals or allow self-assignment to see execution workload.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};