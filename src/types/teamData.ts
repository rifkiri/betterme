export interface TeamMember {
  id: string;
  name: string;
  role: string;
  habitsRate: number;
  tasksRate: number;
  outputsRate: number;
  status: 'excellent' | 'good' | 'average' | 'needs-attention';
  averageMood?: number;
  moodTrend?: 'improving' | 'declining' | 'stable';
}

export interface MoodEntry {
  date: string;
  mood: number;
  memberId: string;
}

export interface OverdueTask {
  id: string;
  title: string;
  assignee: string;
  priority: 'High' | 'Medium' | 'Low';
  daysOverdue: number;
  originalDueDate: string;
}

export interface OverdueOutput {
  id: string;
  title: string;
  assignee: string;
  progress: number;
  daysOverdue: number;
  originalDueDate: string;
}

export interface TeamData {
  totalMembers: number;
  activeMembers: number;
  teamStats: {
    habitsCompletionRate: number;
    tasksCompletionRate: number;
    outputsCompletionRate: number;
    avgHabitStreak: number;
    teamAverageMood?: number;
    teamMoodTrend?: 'improving' | 'declining' | 'stable';
  };
  membersSummary: TeamMember[];
  overdueTasks: OverdueTask[];
  overdueOutputs: OverdueOutput[];
  overdueStats: {
    tasksCount: number;
    outputsCount: number;
    tasksTrend: 'up' | 'down';
    outputsTrend: 'up' | 'down';
    tasksChange: string;
    outputsChange: string;
  };
  moodData?: MoodEntry[];
}
