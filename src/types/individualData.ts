
export interface EmployeeHabit {
  name: string;
  completed: boolean;
  streak: number;
}

export interface EmployeeTask {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  dueDate: string;
}

export interface EmployeeWeeklyOutput {
  id: string;
  title: string;
  progress: number;
  dueDate: string;
}

export interface OverdueTask {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  daysOverdue: number;
  originalDueDate: string;
}

export interface OverdueOutput {
  id: string;
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
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
  stats: EmployeeStats;
  habits: EmployeeHabit[];
  recentTasks: EmployeeTask[];
  weeklyOutputs: EmployeeWeeklyOutput[];
  overdueTasks: OverdueTask[];
  overdueOutputs: OverdueOutput[];
}
