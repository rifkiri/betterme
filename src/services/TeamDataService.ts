import { supabaseDataService } from './SupabaseDataService';
import { TeamData, TeamMember, OverdueTask, OverdueOutput, TeamTrends } from '@/types/teamData';
import { User } from '@/types/userTypes';
import { supabase } from '@/integrations/supabase/client';
import { isTaskOverdue, isWeeklyOutputOverdue, isGoalOverdue } from '@/utils/dateUtils';
import { formatDateForDatabase } from '@/lib/utils';

interface TeamDataServiceConfig {
  userId: string;
}

class TeamDataService {
  // Get current user's team data - now accessible to all authenticated users
  async getCurrentManagerTeamData(config: TeamDataServiceConfig): Promise<TeamData> {
    try {
      console.log('Starting to fetch team data...');
      
      // Get current user's ID from config
      const userId = config.userId;
      if (!userId) {
        throw new Error('No user ID provided');
      }
      
      // Get current user's profile - no longer checking for manager/admin role
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!userProfile) {
        throw new Error('User profile not found');
      }
      
      console.log('User profile:', userProfile);
      
      // Get all users (RLS will handle filtering)
      const allUsers = await supabaseDataService.getUsers();
      console.log('All users:', allUsers);
      
      // Filter for non-admin users (include managers and team members, exclude admins)
      const teamMembers = allUsers.filter(user => user.role !== 'admin');
      console.log('Team members (excluding admins):', teamMembers);
      
      if (teamMembers.length === 0) {
        console.log('No team members found, returning empty data');
        return this.getEmptyTeamData();
      }
      
      // Run top-level aggregations in parallel
      const [teamStats, membersSummary, overdueData, teamTrends, moodData] = await Promise.all([
        this.calculateTeamStats(teamMembers),
        this.generateMembersSummary(teamMembers),
        this.generateOverdueData(teamMembers),
        this.calculateTeamTrends(teamMembers),
        this.generateMoodData(teamMembers),
      ]);


      const result = {
        totalMembers: teamMembers.length,
        activeMembers: teamMembers.filter(member => member.lastLogin).length,
        teamStats,
        membersSummary,
        overdueTasks: overdueData.tasks,
        overdueOutputs: overdueData.outputs,
        overdueGoals: overdueData.goals,
        overdueStats: overdueData.stats,
        moodData,
        teamTrends
      };
      
      console.log('Team data assembled successfully:', result);
      return result;
    } catch (error) {
      console.error('Error loading team data:', error);
      throw error; // Re-throw to let the component handle it
    }
  }

  private getEmptyTeamData(): TeamData {
    return {
      totalMembers: 0,
      activeMembers: 0,
      teamStats: {
        habitsCompletionRate: 0,
        tasksCompletionRate: 0,
        outputsCompletionRate: 0,
        avgHabitStreak: 0,
        teamAverageMood: 0,
        teamMoodTrend: 'stable'
      },
      membersSummary: [],
      overdueTasks: [],
      overdueOutputs: [],
      overdueGoals: [],
      overdueStats: {
        tasksCount: 0,
        outputsCount: 0,
        goalsCount: 0,
        tasksTrend: 'down',
        outputsTrend: 'down',
        goalsTrend: 'down',
        tasksChange: '0',
        outputsChange: '0',
        goalsChange: '0'
      },
      moodData: [],
      teamTrends: {
        habitsTrend: 'stable',
        habitsChange: 0,
        tasksTrend: 'stable',
        tasksChange: 0,
        outputsTrend: 'stable',
        outputsChange: 0
      }
    };
  }

  private async calculateTeamTrends(teamMembers: User[]): Promise<TeamTrends> {
    if (teamMembers.length === 0) {
      return {
        habitsTrend: 'stable',
        habitsChange: 0,
        tasksTrend: 'stable',
        tasksChange: 0,
        outputsTrend: 'stable',
        outputsChange: 0
      };
    }

    try {
      // Calculate current period (last 2 weeks) vs previous period (2 weeks before that)
      const now = new Date();
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

      let currentHabitsRate = 0;
      let previousHabitsRate = 0;
      let currentTasksRate = 0;
      let previousTasksRate = 0;
      let currentOutputsRate = 0;
      let previousOutputsRate = 0;

      await Promise.all(teamMembers.map(async (member) => {
        try {
          // Get member's data in parallel
          const [habits, tasks, outputs] = await Promise.all([
            supabaseDataService.getHabits(member.id),
            supabaseDataService.getTasks(member.id),
            supabaseDataService.getWeeklyOutputs(member.id),
          ]);

          // Filter by date periods
          const currentTasks = tasks.filter(t => 
            t.dueDate && t.dueDate >= twoWeeksAgo && t.dueDate <= now && !t.isDeleted
          );
          const previousTasks = tasks.filter(t => 
            t.dueDate && t.dueDate >= fourWeeksAgo && t.dueDate < twoWeeksAgo && !t.isDeleted
          );

          const currentOutputs = outputs.filter(o => 
            o.dueDate && o.dueDate >= twoWeeksAgo && o.dueDate <= now && !o.isDeleted
          );
          const previousOutputs = outputs.filter(o => 
            o.dueDate && o.dueDate >= fourWeeksAgo && o.dueDate < twoWeeksAgo && !o.isDeleted
          );

          const currentTasksCompleted = currentTasks.filter(t => t.completed).length;
          const currentTasksTotal = currentTasks.length;
          const currentTaskRate = currentTasksTotal > 0 ? (currentTasksCompleted / currentTasksTotal) * 100 : 0;

          const currentOutputsCompleted = currentOutputs.filter(o => o.progress === 100).length;
          const currentOutputsTotal = currentOutputs.length;
          const currentOutputRate = currentOutputsTotal > 0 ? (currentOutputsCompleted / currentOutputsTotal) * 100 : 0;

          const previousTasksCompleted = previousTasks.filter(t => t.completed).length;
          const previousTasksTotal = previousTasks.length;
          const previousTaskRate = previousTasksTotal > 0 ? (previousTasksCompleted / previousTasksTotal) * 100 : 0;

          const previousOutputsCompleted = previousOutputs.filter(o => o.progress === 100).length;
          const previousOutputsTotal = previousOutputs.length;
          const previousOutputRate = previousOutputsTotal > 0 ? (previousOutputsCompleted / previousOutputsTotal) * 100 : 0;

          const activeHabits = habits.filter(h => !h.archived && !h.isDeleted);
          const currentHabitRate = activeHabits.length > 0 ? 
            (activeHabits.filter(h => h.completed).length / activeHabits.length) * 100 : 0;
          const previousHabitRate = activeHabits.length > 0 ? 
            (activeHabits.reduce((sum, h) => sum + Math.max(0, h.streak - 7), 0) / activeHabits.length) * 10 : 0;

          currentHabitsRate += currentHabitRate;
          previousHabitsRate += Math.min(100, previousHabitRate);
          currentTasksRate += currentTaskRate;
          previousTasksRate += previousTaskRate;
          currentOutputsRate += currentOutputRate;
          previousOutputsRate += previousOutputRate;
        } catch (error) {
          console.error(`Error calculating trends for member ${member.id}:`, error);
        }
      }));


      // Average the rates
      const avgCurrentHabits = currentHabitsRate / teamMembers.length;
      const avgPreviousHabits = previousHabitsRate / teamMembers.length;
      const avgCurrentTasks = currentTasksRate / teamMembers.length;
      const avgPreviousTasks = previousTasksRate / teamMembers.length;
      const avgCurrentOutputs = currentOutputsRate / teamMembers.length;
      const avgPreviousOutputs = previousOutputsRate / teamMembers.length;

      // Calculate changes and trends
      const habitsChange = Math.round(avgCurrentHabits - avgPreviousHabits);
      const tasksChange = Math.round(avgCurrentTasks - avgPreviousTasks);
      const outputsChange = Math.round(avgCurrentOutputs - avgPreviousOutputs);

      const getTrend = (change: number): 'up' | 'down' | 'stable' => {
        if (change > 2) return 'up';
        if (change < -2) return 'down';
        return 'stable';
      };

      return {
        habitsTrend: getTrend(habitsChange),
        habitsChange,
        tasksTrend: getTrend(tasksChange),
        tasksChange,
        outputsTrend: getTrend(outputsChange),
        outputsChange
      };
    } catch (error) {
      console.error('Error calculating team trends:', error);
      return {
        habitsTrend: 'stable',
        habitsChange: 0,
        tasksTrend: 'stable',
        tasksChange: 0,
        outputsTrend: 'stable',
        outputsChange: 0
      };
    }
  }

  private async calculateTeamStats(teamMembers: User[]) {
    if (teamMembers.length === 0) {
      return {
        habitsCompletionRate: 0,
        tasksCompletionRate: 0,
        outputsCompletionRate: 0,
        avgHabitStreak: 0,
        teamAverageMood: 0,
        teamMoodTrend: 'stable' as const
      };
    }

    let totalHabitsRate = 0;
    let totalTasksRate = 0;
    let totalOutputsRate = 0;
    let totalHabitStreak = 0;
    let totalMood = 0;
    let membersWithMood = 0;

    await Promise.all(teamMembers.map(async (member) => {
      try {
        const [habits, tasks, outputs, moodEntries] = await Promise.all([
          supabaseDataService.getHabits(member.id),
          supabaseDataService.getTasks(member.id),
          supabaseDataService.getWeeklyOutputs(member.id),
          supabaseDataService.getMoodData(member.id),
        ]);

        const completedHabits = habits.filter(h => h.completed && !h.archived).length;
        const totalHabits = habits.filter(h => !h.archived).length;
        const habitsRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

        const completedTasks = tasks.filter(t => t.completed && !t.isDeleted).length;
        const totalTasks = tasks.filter(t => !t.isDeleted).length;
        const tasksRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        const completedOutputs = outputs.filter(o => o.progress === 100 && !o.isDeleted).length;
        const totalOutputs = outputs.filter(o => !o.isDeleted).length;
        const outputsRate = totalOutputs > 0 ? (completedOutputs / totalOutputs) * 100 : 0;

        const avgStreak = habits.length > 0 ? habits.reduce((sum, h) => sum + h.streak, 0) / habits.length : 0;

        if (moodEntries.length > 0) {
          const recentMood = moodEntries[moodEntries.length - 1]?.mood || 0;
          totalMood += recentMood;
          membersWithMood++;
        }

        totalHabitsRate += habitsRate;
        totalTasksRate += tasksRate;
        totalOutputsRate += outputsRate;
        totalHabitStreak += avgStreak;
      } catch (error) {
        console.error(`Error calculating stats for member ${member.id}:`, error);
      }
    }));


    return {
      habitsCompletionRate: Math.round(totalHabitsRate / teamMembers.length),
      tasksCompletionRate: Math.round(totalTasksRate / teamMembers.length),
      outputsCompletionRate: Math.round(totalOutputsRate / teamMembers.length),
      avgHabitStreak: Math.round(totalHabitStreak / teamMembers.length),
      teamAverageMood: membersWithMood > 0 ? totalMood / membersWithMood : 0,
      teamMoodTrend: 'stable' as const
    };
  }

  private async generateMembersSummary(teamMembers: User[]): Promise<TeamMember[]> {
    const results = await Promise.all(teamMembers.map(async (member) => {
      try {
        const [habits, tasks, outputs] = await Promise.all([
          supabaseDataService.getHabits(member.id),
          supabaseDataService.getTasks(member.id),
          supabaseDataService.getWeeklyOutputs(member.id),
        ]);

        const completedHabits = habits.filter(h => h.completed && !h.archived).length;
        const totalHabits = habits.filter(h => !h.archived).length;
        const habitsRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

        const completedTasks = tasks.filter(t => t.completed && !t.isDeleted).length;
        const totalTasks = tasks.filter(t => !t.isDeleted).length;
        const tasksRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const completedOutputs = outputs.filter(o => o.progress === 100 && !o.isDeleted).length;
        const totalOutputs = outputs.filter(o => !o.isDeleted).length;
        const outputsRate = totalOutputs > 0 ? Math.round((completedOutputs / totalOutputs) * 100) : 0;

        const avgPerformance = (habitsRate + tasksRate + outputsRate) / 3;
        let status: 'excellent' | 'good' | 'average' | 'needs-attention';
        if (avgPerformance >= 90) status = 'excellent';
        else if (avgPerformance >= 75) status = 'good';
        else if (avgPerformance >= 60) status = 'average';
        else status = 'needs-attention';

        return { id: member.id, name: member.name, role: member.role, habitsRate, tasksRate, outputsRate, status } as TeamMember;
      } catch (error) {
        console.error(`Error generating summary for member ${member.id}:`, error);
        return null;
      }
    }));
    return results.filter((r): r is TeamMember => r !== null);
  }

  private async generateOverdueData(teamMembers: User[]) {
    const perMember = await Promise.all(teamMembers.map(async (member) => {
      const localTasks: OverdueTask[] = [];
      const localOutputs: OverdueOutput[] = [];
      try {
        const [tasks, outputs] = await Promise.all([
          supabaseDataService.getTasks(member.id),
          supabaseDataService.getWeeklyOutputs(member.id),
        ]);
        const today = new Date();

        tasks.forEach(task => {
          if (!task.completed && !task.isDeleted && task.dueDate && isTaskOverdue(task.dueDate)) {
            const daysOverdue = Math.floor((today.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24));
            localTasks.push({
              id: task.id,
              title: task.title,
              assignee: member.name,
              priority: task.priority as 'High' | 'Medium' | 'Low',
              daysOverdue,
              originalDueDate: formatDateForDatabase(task.dueDate)
            });
          }
        });

        outputs.forEach(output => {
          if (!output.isDeleted && output.dueDate && isWeeklyOutputOverdue(output.dueDate, output.progress, output.completedDate, output.createdDate)) {
            const daysOverdue = Math.floor((today.getTime() - output.dueDate.getTime()) / (1000 * 60 * 60 * 24));
            localOutputs.push({
              id: output.id,
              title: output.title,
              assignee: member.name,
              progress: output.progress,
              daysOverdue,
              originalDueDate: formatDateForDatabase(output.dueDate)
            });
          }
        });
      } catch (error) {
        console.error(`Error generating overdue data for member ${member.id}:`, error);
      }
      return { localTasks, localOutputs };
    }));

    const overdueTasks: OverdueTask[] = perMember.flatMap(p => p.localTasks);
    const overdueOutputs: OverdueOutput[] = perMember.flatMap(p => p.localOutputs);

    
    return {
      tasks: overdueTasks.slice(0, 10), // Limit to 10 most recent
      outputs: overdueOutputs.slice(0, 10), // Limit to 10 most recent
      stats: {
        tasksCount: overdueTasks.length,
        outputsCount: overdueOutputs.length,
        tasksTrend: 'down' as const,
        outputsTrend: 'down' as const,
        tasksChange: '0',
        outputsChange: '0'
      }
    };
  }

  private async generateMoodData(teamMembers: User[]) {
    const moodData: { date: string; mood: number; memberId: string }[] = [];
    const last30Days: string[] = [];
    
    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last30Days.push(formatDateForDatabase(date));
    }
    
    await Promise.all(teamMembers.map(async (member) => {
      try {
        const moodEntries = await supabaseDataService.getMoodData(member.id);
        last30Days.forEach(date => {
          const dayMood = moodEntries.find(entry => entry.date === date);
          if (dayMood) {
            moodData.push({ date, mood: dayMood.mood, memberId: member.id });
          }
        });
      } catch (error) {
        console.error(`Error generating mood data for member ${member.id}:`, error);
      }
    }));

    
    return moodData;
  }
}

export const teamDataService = new TeamDataService();