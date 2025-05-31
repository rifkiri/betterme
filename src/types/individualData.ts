
export interface EmployeeHabit {
  name: string;
  completed: boolean;
  streak: number;
}

export interface EmployeeTask {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  dueDate: string;
}

export interface EmployeeWeeklyOutput {
  title: string;
  progress: number;
  dueDate: string;
}

export interface OverdueTask {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  daysOverdue: number;
  originalDueDate: string;
}

export interface OverdueOutput {
  title: string;
  progress: number;
  daysOverdue: number;
  originalDueDate: string;
}

export interface EmployeeStats {
  habitsCompletionRate: number;
  tasksCompletionRate: number;
  outputsCompletionRate: number;
  bestStreak: number;
  currentStreak: number;
}

export interface EmployeeData {
  name: string;
  role: string;
  avatar: string;
  stats: EmployeeStats;
  habits: EmployeeHabit[];
  recentTasks: EmployeeTask[];
  weeklyOutputs: EmployeeWeeklyOutput[];
  overdueTasks: OverdueTask[];
  overdueOutputs: OverdueOutput[];
}
