import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Target, BarChart3, TrendingUp, UserCog, UserCheck, Calendar, CheckCircle, FileText, Eye } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { supabaseGoalsService } from '@/services/SupabaseGoalsService';
import { supabaseGoalAssignmentsService } from '@/services/SupabaseGoalAssignmentsService';
import { User } from '@/types/userTypes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TeamWorkloadCharts } from './TeamWorkloadCharts';
import { UserGoalAssignmentCard } from './UserGoalAssignmentCard';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LayoutGrid, UserSquare } from 'lucide-react';
import { GoalLinkedOutputsDialog } from './GoalLinkedOutputsDialog';

interface TeamWorkloadMonitoringProps {
  teamData: any;
  isLoading: boolean;
  onSelectEmployee: (employeeId: string) => void;
}

interface LinkedOutput {
  id: string;
  title: string;
  progress: number;
  dueDate: Date;
  userId: string;
}

interface WorkGoal {
  id: string;
  title: string;
  progress: number;
  coach?: string;
  leads: string[];
  members: string[];
  linkedOutputs: LinkedOutput[];
  outputs: any[];
  tasks: any[];
}

interface MemberWorkload {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  goalsAssigned: number;
  weeklyOutputs: number;
  activeTasks: number;
  workGoalSubcategories: {
    project: number;
    sales: number;
    internal: number;
  };
}

interface UserGoalAssignment {
  userId: string;
  userName: string;
  email: string;
  assignments: Array<{
    goalId: string;
    goalTitle: string;
    role: 'coach' | 'lead' | 'member';
    progress: number;
    subcategory?: string;
  }>;
  totalGoals: number;
  roleBreakdown: {
    coach: number;
    lead: number;
    member: number;
  };
}

export const TeamWorkloadMonitoring = ({ 
  teamData, 
  isLoading, 
  onSelectEmployee 
}: TeamWorkloadMonitoringProps) => {
  const [viewMode, setViewMode] = useState<'goals' | 'outputs' | 'tasks' | 'overview'>('overview');
  const [workloadData, setWorkloadData] = useState<{
    memberWorkloads: MemberWorkload[];
    workGoals: WorkGoal[];
    userGoalAssignments: UserGoalAssignment[];
  }>({ memberWorkloads: [], workGoals: [], userGoalAssignments: [] });
  const [loadingWorkload, setLoadingWorkload] = useState(false);
  const [sortBy, setSortBy] = useState<'goals' | 'outputs' | 'tasks' | 'name'>('goals');
  const [userProfiles, setUserProfiles] = useState<Map<string, User>>(new Map());
  const [goalViewType, setGoalViewType] = useState<'goal' | 'user'>('goal');
  const [selectedGoalForOutputs, setSelectedGoalForOutputs] = useState<WorkGoal | null>(null);

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
      // First, fetch all user profiles to create a proper user lookup
      const allUsers = await supabaseDataService.getUsers();
      const userProfilesMap = new Map<string, User>();
      
      // Include all users (not just those in membersSummary)
      allUsers.forEach(user => {
        userProfilesMap.set(user.id, user);
      });
      
      setUserProfiles(userProfilesMap);

      // Fetch all goal assignments FIRST to create lookup map
      const allAssignments = await supabaseGoalAssignmentsService.getAllGoalAssignments();
      
      // Create lookup map: userId -> Set of assigned goalIds
      const userAssignedGoalIds = new Map<string, Set<string>>();
      allAssignments.forEach(assignment => {
        if (!userAssignedGoalIds.has(assignment.userId)) {
          userAssignedGoalIds.set(assignment.userId, new Set());
        }
        userAssignedGoalIds.get(assignment.userId)!.add(assignment.goalId);
      });

      const memberWorkloads: MemberWorkload[] = [];
      const workGoalsData: WorkGoal[] = [];

      // Process all users (not just those in membersSummary)
      for (const userProfile of allUsers) {
        
        // Generate initials from profile name (first 3 letters)
        const initials = userProfile.name.length >= 3 
          ? userProfile.name.substring(0, 3).toUpperCase()
          : userProfile.name.toUpperCase();
        
        // Get assigned goal IDs for this user
        const assignedGoalIds = userAssignedGoalIds.get(userProfile.id) || new Set<string>();
        
        // Get accessible goals, then filter to ONLY active goals where user has an assignment
        const accessibleGoals = await supabaseGoalsService.getUserAccessibleGoals(userProfile.id);
        const assignedGoals = accessibleGoals.filter(g => 
          !g.archived && g.progress < 100 && assignedGoalIds.has(g.id)
        );
        const totalGoals = assignedGoals.length;
        
        // Count work goal subcategories from ASSIGNED goals only
        const assignedWorkGoals = assignedGoals.filter(g => g.category === 'work');
        const workGoalSubcategories = {
          project: assignedWorkGoals.filter(g => g.subcategory === 'project').length,
          sales: assignedWorkGoals.filter(g => g.subcategory === 'sales').length,
          internal: assignedWorkGoals.filter(g => g.subcategory === 'internal').length,
        };
        
        // Get tasks and outputs counts
        const tasks = await supabaseDataService.getTasks(userProfile.id);
        const outputs = await supabaseDataService.getWeeklyOutputs(userProfile.id);
        const activeTasks = tasks.filter(t => !t.completed && !t.isDeleted).length;
        const activeOutputs = outputs.filter(o => !o.isDeleted && o.progress < 100).length;

        memberWorkloads.push({
          id: userProfile.id,
          name: userProfile.name,
          email: userProfile.email,
          role: userProfile.role,
          initials: initials,
          goalsAssigned: totalGoals,
          weeklyOutputs: activeOutputs,
          activeTasks: activeTasks,
          workGoalSubcategories
        });
      }

      // Get all work goals for goals view
      const allGoals = await supabaseGoalsService.getAllGoals();
      // Note: allAssignments is already fetched above
      
      // Fetch all outputs from all users to create a lookup by linked_goal_id
      const allOutputsWithGoalLinks: Array<LinkedOutput & { linkedGoalId: string }> = [];
      for (const userProfile of allUsers) {
        const userOutputs = await supabaseDataService.getWeeklyOutputs(userProfile.id);
        for (const output of userOutputs) {
          if (output.linkedGoalId && !output.isDeleted) {
            allOutputsWithGoalLinks.push({
              id: output.id,
              title: output.title,
              progress: output.progress,
              dueDate: output.dueDate,
              userId: userProfile.id,
              linkedGoalId: output.linkedGoalId
            });
          }
        }
      }
      
      // Create user-centric goal assignment data
      const userAssignmentMap = new Map<string, UserGoalAssignment>();
      
      for (const goal of allGoals.filter(g => g.category === 'work' && !g.archived && g.progress < 100)) {
        // Get goal assignments from goal_assignments table
        const assignments = await supabaseGoalAssignmentsService.getAssignmentsForGoal(goal.id);
        
        // Group assignments by role
        const coach = assignments.find(a => a.role === 'coach');
        const leads = assignments.filter(a => a.role === 'lead');
        const members = assignments.filter(a => a.role === 'member');
        
        // Process assignments for user-centric view
        for (const assignment of assignments) {
          const userProfile = userProfilesMap.get(assignment.userId);
          if (!userProfile) continue;
          
          if (!userAssignmentMap.has(assignment.userId)) {
            userAssignmentMap.set(assignment.userId, {
              userId: assignment.userId,
              userName: userProfile.name,
              email: userProfile.email,
              assignments: [],
              totalGoals: 0,
              roleBreakdown: {
                coach: 0,
                lead: 0,
                member: 0
              }
            });
          }
          
          const userAssignment = userAssignmentMap.get(assignment.userId)!;
          userAssignment.assignments.push({
            goalId: goal.id,
            goalTitle: goal.title || '',
            role: assignment.role,
            progress: goal.progress,
            subcategory: goal.subcategory
          });
          userAssignment.totalGoals++;
          userAssignment.roleBreakdown[assignment.role]++;
        }
        
        // Get linked outputs for this goal from pre-fetched outputs (efficient lookup)
        const linkedOutputsForGoal: LinkedOutput[] = allOutputsWithGoalLinks
          .filter(o => o.linkedGoalId === goal.id)
          .map(({ linkedGoalId, ...output }) => output);
        
        // Get linked outputs and tasks - Note: will need to use ItemLinkageService in the future
        const outputs: any[] = [];

        const tasks = [];
        for (const output of outputs.filter(Boolean)) {
          try {
            const memberTasks = await supabaseDataService.getTasks(output.userId!);
            tasks.push(...memberTasks.filter(t => t.weeklyOutputId === output.id));
          } catch {
            // Continue if error
          }
        }

        workGoalsData.push({
          id: goal.id,
          title: goal.title,
          progress: goal.progress,
          coach: coach ? userProfilesMap.get(coach.userId)?.name : undefined,
          leads: leads.map(l => userProfilesMap.get(l.userId)?.name).filter(Boolean),
          members: members.map(m => userProfilesMap.get(m.userId)?.name).filter(Boolean),
          linkedOutputs: linkedOutputsForGoal,
          outputs: outputs.filter(Boolean),
          tasks
        });
      }
      
      // Convert map to array for userGoalAssignments
      const userGoalAssignments = Array.from(userAssignmentMap.values());

      setWorkloadData({ memberWorkloads, workGoals: workGoalsData, userGoalAssignments });
    } catch (error) {
      console.error('Error loading workload data:', error);
    } finally {
      setLoadingWorkload(false);
    }
  };

  const getWorkloadLevel = (totalCount: number): 'low' | 'medium' | 'high' => {
    if (totalCount <= 5) return 'low';
    if (totalCount <= 10) return 'medium';
    return 'high';
  };

  const getWorkloadColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const COLORS = {
    project: '#3B82F6',
    sales: '#10B981', 
    internal: '#8B5CF6'
  };

  const sortedMembers = [...workloadData.memberWorkloads].sort((a, b) => {
    switch (sortBy) {
      case 'goals':
        return b.goalsAssigned - a.goalsAssigned;
      case 'outputs':
        return b.weeklyOutputs - a.weeklyOutputs;
      case 'tasks':
        return b.activeTasks - a.activeTasks;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  // Prepare chart data using user ID-based lookup
  const chartData = workloadData.memberWorkloads.map(member => ({
    name: member.initials, // Use consistent initials from profile
    fullName: member.name, // Use name from profile
    goals: member.goalsAssigned,
    outputs: member.weeklyOutputs,
    tasks: member.activeTasks,
    project: member.workGoalSubcategories.project,
    sales: member.workGoalSubcategories.sales,
    internal: member.workGoalSubcategories.internal,
    total: member.goalsAssigned + member.weeklyOutputs + member.activeTasks,
    workloadLevel: getWorkloadLevel(member.goalsAssigned + member.weeklyOutputs + member.activeTasks)
  }));

  // Subcategory distribution for pie chart
  const subcategoryData = [
    { 
      name: 'Project Goals', 
      value: workloadData.memberWorkloads.reduce((sum, m) => sum + m.workGoalSubcategories.project, 0),
      color: COLORS.project
    },
    { 
      name: 'Sales Goals', 
      value: workloadData.memberWorkloads.reduce((sum, m) => sum + m.workGoalSubcategories.sales, 0),
      color: COLORS.sales
    },
    { 
      name: 'Internal Goals', 
      value: workloadData.memberWorkloads.reduce((sum, m) => sum + m.workGoalSubcategories.internal, 0),
      color: COLORS.internal
    }
  ].filter(item => item.value > 0);

  const teamStats = {
    totalGoals: workloadData.workGoals.length,
    totalOutputs: workloadData.memberWorkloads.reduce((sum, m) => sum + m.weeklyOutputs, 0),
    totalTasks: workloadData.memberWorkloads.reduce((sum, m) => sum + m.activeTasks, 0),
    highWorkloadCount: chartData.filter(m => m.workloadLevel === 'high').length
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="outputs" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Outputs
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{teamStats.totalGoals}</div>
                  <div className="text-sm text-gray-600">Total Goals</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{teamStats.totalOutputs}</div>
                  <div className="text-sm text-gray-600">Active Outputs</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{teamStats.totalTasks}</div>
                  <div className="text-sm text-gray-600">Active Tasks</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{teamStats.highWorkloadCount}</div>
                  <div className="text-sm text-gray-600">High Workload</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Team Workload Overview</CardTitle>
              <CardDescription>Goals, Outputs, and Tasks per team member</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [value, name === 'goals' ? 'Goals' : name === 'outputs' ? 'Outputs' : 'Tasks']}
                    labelFormatter={(label) => `${chartData.find(d => d.name === label)?.fullName || label}`}
                  />
                  <Bar dataKey="goals" fill="#3B82F6" name="goals" />
                  <Bar dataKey="outputs" fill="#10B981" name="outputs" />
                  <Bar dataKey="tasks" fill="#8B5CF6" name="tasks" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Team Members Summary</span>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goals">Sort by Goals</SelectItem>
                    <SelectItem value="outputs">Sort by Outputs</SelectItem>
                    <SelectItem value="tasks">Sort by Tasks</SelectItem>
                    <SelectItem value="name">Sort by Name</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingWorkload ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading workload data...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedMembers.map((member) => {
                    const totalWorkload = member.goalsAssigned + member.weeklyOutputs + member.activeTasks;
                    const workloadLevel = getWorkloadLevel(totalWorkload);
                    return (
                      <Card key={member.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-gray-900">{member.name}</h3>
                          <Badge className={`text-xs ${getWorkloadColor(workloadLevel)}`}>
                            {workloadLevel.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Goals Assigned:</span>
                            <span className="font-medium text-blue-600">{member.goalsAssigned}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Active Outputs:</span>
                            <span className="font-medium text-green-600">{member.weeklyOutputs}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Active Tasks:</span>
                            <span className="font-medium text-purple-600">{member.activeTasks}</span>
                          </div>
                          
                          {(member.workGoalSubcategories.project > 0 || 
                            member.workGoalSubcategories.sales > 0 || 
                            member.workGoalSubcategories.internal > 0) && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="text-xs text-gray-500 mb-2">Work Goal Breakdown:</div>
                              <div className="flex gap-1 flex-wrap">
                                {member.workGoalSubcategories.project > 0 && (
                                  <Badge style={{ backgroundColor: COLORS.project, color: 'white' }} className="text-xs">
                                    Project: {member.workGoalSubcategories.project}
                                  </Badge>
                                )}
                                {member.workGoalSubcategories.sales > 0 && (
                                  <Badge style={{ backgroundColor: COLORS.sales, color: 'white' }} className="text-xs">
                                    Sales: {member.workGoalSubcategories.sales}
                                  </Badge>
                                )}
                                {member.workGoalSubcategories.internal > 0 && (
                                  <Badge style={{ backgroundColor: COLORS.internal, color: 'white' }} className="text-xs">
                                    Internal: {member.workGoalSubcategories.internal}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
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
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          {loadingWorkload ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading workload data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <TeamWorkloadCharts 
                chartData={chartData} 
                chartType="goals" 
                onMemberClick={onSelectEmployee}
              />
              
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Goal Assignments</CardTitle>
                    <ToggleGroup type="single" value={goalViewType} onValueChange={(value) => value && setGoalViewType(value as 'goal' | 'user')}>
                      <ToggleGroupItem value="goal" aria-label="Goal view">
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Goal View
                      </ToggleGroupItem>
                      <ToggleGroupItem value="user" aria-label="User view">
                        <UserSquare className="h-4 w-4 mr-2" />
                        User View
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  <CardDescription>
                    {goalViewType === 'goal' 
                      ? 'Work goals with team member assignments' 
                      : 'Team members and their assigned goals'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {goalViewType === 'goal' ? (
                    // Goal View (existing implementation)
                    workloadData.workGoals.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {workloadData.workGoals.map((goal) => {
                          const totalAssigned = (goal.coach ? 1 : 0) + goal.leads.length + goal.members.length;
                          return (
                            <Card key={goal.id} className="p-4 hover:shadow-md transition-shadow">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <h3 className="font-medium text-gray-900 leading-tight">{goal.title}</h3>
                                  <Badge variant="outline" className="ml-2 flex-shrink-0">
                                    {totalAssigned} {totalAssigned === 1 ? 'person' : 'people'}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Progress:</span>
                                    <span className="font-medium">{goal.progress}%</span>
                                  </div>
                                  <Progress value={goal.progress} className="h-2" />
                                </div>

                                {totalAssigned > 0 && (
                                  <div className="space-y-2 text-sm">
                                    {goal.coach && (
                                      <div className="flex items-center gap-2">
                                        <UserCog className="h-3 w-3 text-blue-600" />
                                        <span className="text-gray-600">Coach:</span>
                                        <span className="font-medium">{goal.coach}</span>
                                      </div>
                                    )}
                                    
                                    {goal.leads.length > 0 && (
                                      <div className="flex items-center gap-2">
                                        <UserCheck className="h-3 w-3 text-green-600" />
                                        <span className="text-gray-600">Leads:</span>
                                        <span className="font-medium">{goal.leads.join(', ')}</span>
                                      </div>
                                    )}
                                    
                                    {goal.members.length > 0 && (
                                      <div className="flex items-center gap-2">
                                        <Users className="h-3 w-3 text-purple-600" />
                                        <span className="text-gray-600">Members:</span>
                                        <span className="font-medium">{goal.members.join(', ')}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center gap-2 pt-2 border-t">
                                  <Badge variant="secondary" className="text-xs">
                                    <FileText className="h-3 w-3 mr-1" />
                                    {goal.linkedOutputs.length} {goal.linkedOutputs.length === 1 ? 'output' : 'outputs'}
                                  </Badge>
                                </div>

                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full"
                                  onClick={() => setSelectedGoalForOutputs(goal)}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-2" />
                                  View Details
                                </Button>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">No work goals found</p>
                    )
                  ) : (
                    // User View (new implementation)
                    workloadData.userGoalAssignments.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {workloadData.userGoalAssignments.map((assignment) => (
                          <UserGoalAssignmentCard
                            key={assignment.userId}
                            assignment={assignment}
                            onViewDetails={onSelectEmployee}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">No goal assignments found</p>
                    )
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="outputs" className="space-y-4">
          {loadingWorkload ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading workload data...</p>
            </div>
          ) : (
            <TeamWorkloadCharts 
              chartData={chartData} 
              chartType="outputs" 
              onMemberClick={onSelectEmployee}
            />
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          {loadingWorkload ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading workload data...</p>
            </div>
          ) : (
            <TeamWorkloadCharts 
              chartData={chartData} 
              chartType="tasks" 
              onMemberClick={onSelectEmployee}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Goal Linked Outputs Dialog */}
      <GoalLinkedOutputsDialog
        open={!!selectedGoalForOutputs}
        onOpenChange={(open) => !open && setSelectedGoalForOutputs(null)}
        goalTitle={selectedGoalForOutputs?.title || ''}
        outputs={selectedGoalForOutputs?.linkedOutputs || []}
        userProfiles={userProfiles}
      />
    </div>
  );
};