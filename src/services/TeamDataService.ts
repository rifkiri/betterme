import { supabaseDataService } from './SupabaseDataService';
import { TeamData, TeamMember, OverdueTask, OverdueOutput, TeamTrends } from '@/types/teamData';
import { User } from '@/types/userTypes';
import { supabase } from '@/integrations/supabase/client';

class TeamDataService {
  // Get current manager's team data
  async getCurrentManagerTeamData(): Promise<TeamData> {
    try {
      console.log('Starting to fetch team data...');
      
      // Get current manager's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      // Get current manager's profile to verify they are a manager
      const { data: managerProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!managerProfile || managerProfile.role !== 'manager') {
        throw new Error('User is not a manager');
      }
      
      console.log('Manager profile:', managerProfile);
      
      // Get all team members (RLS will handle filtering)
      const allUsers = await supabaseDataService.getUsers();
      console.log('All users:', allUsers);
      
      // Filter for team members only (no manager-specific filtering needed due to RLS)
      const teamMembers = allUsers.filter(user => user.role === 'team-member');
      console.log('Team members:', teamMembers);
      
      if (teamMembers.length === 0) {
        console.log('No team members found, returning empty data');
        return this.getEmptyTeamData();
      }
      
      // Generate team statistics
      console.log('Calculating team stats...');
      const teamStats = await this.calculateTeamStats(teamMembers);
      
      console.log('Generating members summary...');
      const membersSummary = await this.generateMembersSummary(teamMembers);
      
      console.log('Generating overdue data...');
      const overdueData = await this.generateOverdueData(teamMembers);
      
      console.log('Calculating team trends...');
      const teamTrends = await this.calculateTeamTrends(teamMembers);
      
      console.log('Generating mood data...');
      const moodData = await this.generateMoodData(teamMembers);

      const result = {
        totalMembers: teamMembers.length,
        activeMembers: teamMembers.filter(member => member.lastLogin).length,
        teamStats,
        membersSummary,
        overdueTasks: overdueData.tasks,
        overdueOutputs: overdueData.outputs,
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
      overdueStats: {
        tasksCount: 0,
        outputsCount: 0,
        tasksTrend: 'down',
        outputsTrend: 'down',
        tasksChange: '0',
        outputsChange: '0'
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

      for (const member of teamMembers) {
        try {
          // Get member's data
          const habits = await supabaseDataService.getHabits(member.id);
          const tasks = await supabaseDataService.getTasks(member.id);
          const outputs = await supabaseDataService.getWeeklyOutputs(member.id);

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

          // Calculate rates for current period
          const currentTasksCompleted = currentTasks.filter(t => t.completed).length;
          const currentTasksTotal = currentTasks.length;
          const currentTaskRate = currentTasksTotal > 0 ? (currentTasksCompleted / currentTasksTotal) * 100 : 0;

          const currentOutputsCompleted = currentOutputs.filter(o => o.progress === 100).length;
          const currentOutputsTotal = currentOutputs.length;
          const currentOutputRate = currentOutputsTotal > 0 ? (currentOutputsCompleted / currentOutputsTotal) * 100 : 0;

          // Calculate rates for previous period
          const previousTasksCompleted = previousTasks.filter(t => t.completed).length;
          const previousTasksTotal = previousTasks.length;
          const previousTaskRate = previousTasksTotal > 0 ? (previousTasksCompleted / previousTasksTotal) * 100 : 0;

          const previousOutputsCompleted = previousOutputs.filter(o => o.progress === 100).length;
          const previousOutputsTotal = previousOutputs.length;
          const previousOutputRate = previousOutputsTotal > 0 ? (previousOutputsCompleted / previousOutputsTotal) * 100 : 0;

          // For habits, we'll use a simple current vs previous streak comparison
          const activeHabits = habits.filter(h => !h.archived && !h.isDeleted);
          const currentHabitRate = activeHabits.length > 0 ? 
            (activeHabits.filter(h => h.completed).length / activeHabits.length) * 100 : 0;
          const previousHabitRate = activeHabits.length > 0 ? 
            (activeHabits.reduce((sum, h) => sum + Math.max(0, h.streak - 7), 0) / activeHabits.length) * 10 : 0; // Rough estimate

          currentHabitsRate += currentHabitRate;
          previousHabitsRate += Math.min(100, previousHabitRate);
          currentTasksRate += currentTaskRate;
          previousTasksRate += previousTaskRate;
          currentOutputsRate += currentOutputRate;
          previousOutputsRate += previousOutputRate;
        } catch (error) {
          console.error(`Error calculating trends for member ${member.id}:`, error);
        }
      }

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

    for (const member of teamMembers) {
      try {
        // Get member's habits
        const habits = await supabaseDataService.getHabits(member.id);
        const completedHabits = habits.filter(h => h.completed && !h.archived).length;
        const totalHabits = habits.filter(h => !h.archived).length;
        const habitsRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;
        
        // Get member's tasks
        const tasks = await supabaseDataService.getTasks(member.id);
        const completedTasks = tasks.filter(t => t.completed && !t.isDeleted).length;
        const totalTasks = tasks.filter(t => !t.isDeleted).length;
        const tasksRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
        // Get member's weekly outputs
        const outputs = await supabaseDataService.getWeeklyOutputs(member.id);
        const completedOutputs = outputs.filter(o => o.progress === 100 && !o.isDeleted).length;
        const totalOutputs = outputs.filter(o => !o.isDeleted).length;
        const outputsRate = totalOutputs > 0 ? (completedOutputs / totalOutputs) * 100 : 0;
        
        // Calculate average habit streak
        const avgStreak = habits.length > 0 ? habits.reduce((sum, h) => sum + h.streak, 0) / habits.length : 0;
        
        // Get recent mood data
        const moodEntries = await supabaseDataService.getMoodData(member.id);
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
    }

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
    const membersSummary: TeamMember[] = [];

    for (const member of teamMembers) {
      try {
        // Get member's data
        const habits = await supabaseDataService.getHabits(member.id);
        const tasks = await supabaseDataService.getTasks(member.id);
        const outputs = await supabaseDataService.getWeeklyOutputs(member.id);
        
        // Calculate rates
        const completedHabits = habits.filter(h => h.completed && !h.archived).length;
        const totalHabits = habits.filter(h => !h.archived).length;
        const habitsRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
        
        const completedTasks = tasks.filter(t => t.completed && !t.isDeleted).length;
        const totalTasks = tasks.filter(t => !t.isDeleted).length;
        const tasksRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        const completedOutputs = outputs.filter(o => o.progress === 100 && !o.isDeleted).length;
        const totalOutputs = outputs.filter(o => !o.isDeleted).length;
        const outputsRate = totalOutputs > 0 ? Math.round((completedOutputs / totalOutputs) * 100) : 0;
        
        // Determine status based on average performance
        const avgPerformance = (habitsRate + tasksRate + outputsRate) / 3;
        let status: 'excellent' | 'good' | 'average' | 'needs-attention';
        
        if (avgPerformance >= 90) status = 'excellent';
        else if (avgPerformance >= 75) status = 'good';
        else if (avgPerformance >= 60) status = 'average';
        else status = 'needs-attention';
        
        membersSummary.push({
          id: member.id,
          name: member.name,
          role: member.position || 'Team Member',
          habitsRate,
          tasksRate,
          outputsRate,
          status
        });
      } catch (error) {
        console.error(`Error generating summary for member ${member.id}:`, error);
      }
    }

    return membersSummary;
  }

  private async generateOverdueData(teamMembers: User[]) {
    const overdueTasks: OverdueTask[] = [];
    const overdueOutputs: OverdueOutput[] = [];
    
    for (const member of teamMembers) {
      try {
        // Get overdue tasks
        const tasks = await supabaseDataService.getTasks(member.id);
        const today = new Date();
        
        tasks.forEach(task => {
          if (!task.completed && !task.isDeleted && task.dueDate && task.dueDate < today) {
            const daysOverdue = Math.floor((today.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24));
            overdueTasks.push({
              id: task.id,
              title: task.title,
              assignee: member.name,
              priority: task.priority as 'High' | 'Medium' | 'Low',
              daysOverdue,
              originalDueDate: task.dueDate.toISOString().split('T')[0]
            });
          }
        });
        
        // Get overdue outputs
        const outputs = await supabaseDataService.getWeeklyOutputs(member.id);
        outputs.forEach(output => {
          if (output.progress < 100 && !output.isDeleted && output.dueDate && output.dueDate < today) {
            const daysOverdue = Math.floor((today.getTime() - output.dueDate.getTime()) / (1000 * 60 * 60 * 24));
            overdueOutputs.push({
              id: output.id,
              title: output.title,
              assignee: member.name,
              progress: output.progress,
              daysOverdue,
              originalDueDate: output.dueDate.toISOString().split('T')[0]
            });
          }
        });
      } catch (error) {
        console.error(`Error generating overdue data for member ${member.id}:`, error);
      }
    }
    
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
      last30Days.push(date.toISOString().split('T')[0]);
    }
    
    // Get mood data for each day and member
    for (const member of teamMembers) {
      try {
        const moodEntries = await supabaseDataService.getMoodData(member.id);
        
        last30Days.forEach(date => {
          const dayMood = moodEntries.find(entry => entry.date === date);
          if (dayMood) {
            moodData.push({
              date,
              mood: dayMood.mood,
              memberId: member.id
            });
          }
        });
      } catch (error) {
        console.error(`Error generating mood data for member ${member.id}:`, error);
      }
    }
    
    return moodData;
  }
}

export const teamDataService = new TeamDataService();
