import { localDataService } from './LocalDataService';
import { TeamData, TeamMember, OverdueTask, OverdueOutput } from '@/types/teamData';
import { User } from '@/types/userTypes';

class TeamDataService {
  // Get current manager's team data
  getCurrentManagerTeamData(): TeamData {
    const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
    
    if (authUser.role !== 'manager') {
      return this.getEmptyTeamData();
    }

    // Get all users (team members under this manager)
    const allUsers = localDataService.getUsers();
    const teamMembers = allUsers.filter(user => user.role === 'team-member');
    
    // Generate team statistics
    const teamStats = this.calculateTeamStats(teamMembers);
    const membersSummary = this.generateMembersSummary(teamMembers);
    const overdueData = this.generateOverdueData(teamMembers);
    
    return {
      totalMembers: teamMembers.length,
      activeMembers: teamMembers.filter(member => member.lastLogin).length,
      teamStats,
      membersSummary,
      overdueTasks: overdueData.tasks,
      overdueOutputs: overdueData.outputs,
      overdueStats: overdueData.stats,
      moodData: this.generateMoodData(teamMembers)
    };
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
      moodData: []
    };
  }

  private calculateTeamStats(teamMembers: User[]) {
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

    teamMembers.forEach(member => {
      // Get member's habits
      const habits = localDataService.getHabits(member.id);
      const completedHabits = habits.filter(h => h.completed && !h.archived).length;
      const totalHabits = habits.filter(h => !h.archived).length;
      const habitsRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;
      
      // Get member's tasks
      const tasks = localDataService.getTasks(member.id);
      const completedTasks = tasks.filter(t => t.completed && !t.isDeleted).length;
      const totalTasks = tasks.filter(t => !t.isDeleted).length;
      const tasksRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      // Get member's weekly outputs
      const outputs = localDataService.getWeeklyOutputs(member.id);
      const completedOutputs = outputs.filter(o => o.progress === 100 && !o.isDeleted).length;
      const totalOutputs = outputs.filter(o => !o.isDeleted).length;
      const outputsRate = totalOutputs > 0 ? (completedOutputs / totalOutputs) * 100 : 0;
      
      // Calculate average habit streak
      const avgStreak = habits.length > 0 ? habits.reduce((sum, h) => sum + h.streak, 0) / habits.length : 0;
      
      // Get recent mood data
      const moodEntries = localDataService.getMoodData(member.id);
      if (moodEntries.length > 0) {
        const recentMood = moodEntries[moodEntries.length - 1]?.mood || 0;
        totalMood += recentMood;
        membersWithMood++;
      }
      
      totalHabitsRate += habitsRate;
      totalTasksRate += tasksRate;
      totalOutputsRate += outputsRate;
      totalHabitStreak += avgStreak;
    });

    return {
      habitsCompletionRate: Math.round(totalHabitsRate / teamMembers.length),
      tasksCompletionRate: Math.round(totalTasksRate / teamMembers.length),
      outputsCompletionRate: Math.round(totalOutputsRate / teamMembers.length),
      avgHabitStreak: Math.round(totalHabitStreak / teamMembers.length),
      teamAverageMood: membersWithMood > 0 ? totalMood / membersWithMood : 0,
      teamMoodTrend: 'stable' as const
    };
  }

  private generateMembersSummary(teamMembers: User[]): TeamMember[] {
    return teamMembers.map(member => {
      // Get member's data
      const habits = localDataService.getHabits(member.id);
      const tasks = localDataService.getTasks(member.id);
      const outputs = localDataService.getWeeklyOutputs(member.id);
      
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
      
      return {
        id: member.id,
        name: member.name,
        role: member.position || 'Team Member',
        habitsRate,
        tasksRate,
        outputsRate,
        status
      };
    });
  }

  private generateOverdueData(teamMembers: User[]) {
    const overdueTasks: OverdueTask[] = [];
    const overdueOutputs: OverdueOutput[] = [];
    
    teamMembers.forEach(member => {
      // Get overdue tasks
      const tasks = localDataService.getTasks(member.id);
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
      const outputs = localDataService.getWeeklyOutputs(member.id);
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
    });
    
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

  private generateMoodData(teamMembers: User[]) {
    const moodData: { date: string; mood: number; memberId: string }[] = [];
    const last30Days: string[] = [];
    
    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last30Days.push(date.toISOString().split('T')[0]);
    }
    
    // Get mood data for each day and member
    last30Days.forEach(date => {
      teamMembers.forEach(member => {
        const moodEntries = localDataService.getMoodData(member.id);
        const dayMood = moodEntries.find(entry => entry.date === date);
        if (dayMood) {
          moodData.push({
            date,
            mood: dayMood.mood,
            memberId: member.id
          });
        }
      });
    });
    
    return moodData;
  }
}

export const teamDataService = new TeamDataService();
