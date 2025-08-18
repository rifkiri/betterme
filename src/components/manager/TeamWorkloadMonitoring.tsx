import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, Target, User, UserCheck, UserCog, Calendar, CheckCircle } from 'lucide-react';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { supabaseGoalsService } from '@/services/SupabaseGoalsService';
import { supabaseGoalAssignmentsService } from '@/services/SupabaseGoalAssignmentsService';

interface TeamWorkloadMonitoringProps {
  teamData: any;
  isLoading: boolean;
  onSelectEmployee: (employeeId: string) => void;
}

interface WorkGoal {
  id: string;
  title: string;
  progress: number;
  coach?: string;
  leads: string[];
  members: string[];
  outputs: any[];
  tasks: any[];
}

interface MemberWorkload {
  id: string;
  name: string;
  role: string;
  workGoals: number;
  personalGoals: number;
  coachingCount: number;
  leadingCount: number;
  memberCount: number;
  totalTasks: number;
  totalOutputs: number;
}

export const TeamWorkloadMonitoring = ({ 
  teamData, 
  isLoading, 
  onSelectEmployee 
}: TeamWorkloadMonitoringProps) => {
  const [viewMode, setViewMode] = useState<'members' | 'goals' | 'coach' | 'lead' | 'member'>('members');
  const [workloadData, setWorkloadData] = useState<{
    memberWorkloads: MemberWorkload[];
    workGoals: WorkGoal[];
  }>({ memberWorkloads: [], workGoals: [] });
  const [loadingWorkload, setLoadingWorkload] = useState(false);

  useEffect(() => {
    console.log('TeamWorkloadMonitoring useEffect - teamData:', teamData);
    if (teamData?.membersSummary?.length > 0) {
      console.log('Loading workload data for members:', teamData.membersSummary);
      loadWorkloadData();
    } else {
      console.log('No members found in teamData:', teamData);
    }
  }, [teamData]);

  const loadWorkloadData = async () => {
    setLoadingWorkload(true);
    try {
      const memberWorkloads: MemberWorkload[] = [];
      const workGoals: WorkGoal[] = [];
      const userMap = new Map();

      // Process each team member
      for (const member of teamData.membersSummary) {
        userMap.set(member.id, member.name);
        
        // Get member's goals
        const goals = await supabaseGoalsService.getUserAccessibleGoals(member.id);
        const workGoalsCount = goals.filter(g => g.category === 'work' && !g.archived).length;
        const personalGoalsCount = goals.filter(g => g.category === 'personal' && !g.archived).length;
        
        // Count role assignments
        let coachingCount = 0;
        let leadingCount = 0;
        let memberCount = 0;
        
        for (const goal of goals) {
          if (goal.category === 'work' && !goal.archived) {
            if (goal.coachId === member.id) coachingCount++;
            if (goal.leadIds?.includes(member.id)) leadingCount++;
            if (goal.memberIds?.includes(member.id)) memberCount++;
          }
        }
        
        // Get tasks and outputs counts
        const tasks = await supabaseDataService.getTasks(member.id);
        const outputs = await supabaseDataService.getWeeklyOutputs(member.id);
        
        memberWorkloads.push({
          id: member.id,
          name: member.name,
          role: member.role,
          workGoals: workGoalsCount,
          personalGoals: personalGoalsCount,
          coachingCount,
          leadingCount,
          memberCount,
          totalTasks: tasks.filter(t => !t.isDeleted).length,
          totalOutputs: outputs.filter(o => !o.isDeleted).length
        });
      }

      // Get all work goals for goals view
      const allGoals = await supabaseGoalsService.getAllGoals();
      for (const goal of allGoals.filter(g => g.category === 'work' && !g.archived)) {
        // Get goal assignments from goal_assignments table
        const assignments = await supabaseGoalAssignmentsService.getAssignmentsForGoal(goal.id);
        
        // Group assignments by role
        const coach = assignments.find(a => a.role === 'coach');
        const leads = assignments.filter(a => a.role === 'lead');
        const members = assignments.filter(a => a.role === 'member');
        
        // Get linked outputs and tasks
        const outputs = await Promise.all(
          goal.linkedOutputIds?.map(async (outputId) => {
            try {
              const output = await supabaseDataService.getWeeklyOutputs(goal.userId!);
              return output.find(o => o.id === outputId);
            } catch {
              return null;
            }
          }) || []
        );

        const tasks = [];
        for (const output of outputs.filter(Boolean)) {
          try {
            const memberTasks = await supabaseDataService.getTasks(output.userId!);
            tasks.push(...memberTasks.filter(t => t.weeklyOutputId === output.id));
          } catch {
            // Continue if error
          }
        }

        workGoals.push({
          id: goal.id,
          title: goal.title,
          progress: goal.progress,
          coach: coach ? userMap.get(coach.userId) : undefined,
          leads: leads.map(l => userMap.get(l.userId)).filter(Boolean),
          members: members.map(m => userMap.get(m.userId)).filter(Boolean),
          outputs: outputs.filter(Boolean),
          tasks
        });
      }

      setWorkloadData({ memberWorkloads, workGoals });
    } catch (error) {
      console.error('Error loading workload data:', error);
    } finally {
      setLoadingWorkload(false);
    }
  };

  console.log('TeamWorkloadMonitoring - teamData:', teamData);
  console.log('TeamWorkloadMonitoring - isLoading:', isLoading);

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

  if (!teamData || !teamData.membersSummary) {
    console.log('No team data or membersSummary available:', teamData);
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
              {loadingWorkload ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading workload data...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workloadData.memberWorkloads.map((member) => (
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
                          <span className="font-medium text-blue-600">{member.workGoals}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Personal Goals:</span>
                          <span className="font-medium text-green-600">{member.personalGoals}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tasks:</span>
                          <span className="font-medium text-purple-600">{member.totalTasks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Outputs:</span>
                          <span className="font-medium text-orange-600">{member.totalOutputs}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Role Distribution:</span>
                          <div className="flex gap-1">
                            <Badge variant="secondary" className="text-xs px-1" title="Coach">
                              C:{member.coachingCount}
                            </Badge>
                            <Badge variant="secondary" className="text-xs px-1" title="Lead">
                              L:{member.leadingCount}
                            </Badge>
                            <Badge variant="secondary" className="text-xs px-1" title="Member">
                              M:{member.memberCount}
                            </Badge>
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
              )}
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
              {loadingWorkload ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading workload data...</p>
                </div>
              ) : workloadData.workGoals.length > 0 ? (
                <div className="space-y-4">
                  {workloadData.workGoals.map((goal) => (
                    <Card key={goal.id} className="p-4 border-l-4 border-l-blue-500">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">{goal.title}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <Progress value={goal.progress} className="flex-1 h-2" />
                            <span className="text-sm font-medium text-gray-600">{goal.progress}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <UserCog className="h-3 w-3" />
                            Coach
                          </h4>
                          {goal.coach ? (
                            <Badge variant="outline" className="text-xs">
                              {goal.coach}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">Not assigned</span>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <UserCheck className="h-3 w-3" />
                            Leads ({goal.leads.length})
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {goal.leads.length > 0 ? (
                              goal.leads.map((lead, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {lead}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-400">No leads assigned</span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Members ({goal.members.length})
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {goal.members.length > 0 ? (
                              goal.members.map((member, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {member}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-400">No members assigned</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Outputs: {goal.outputs.length}
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Tasks: {goal.tasks.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No work goals created yet.</p>
                  <p className="text-sm mt-1">Create work goals to see them here with their role assignments.</p>
                </div>
              )}
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