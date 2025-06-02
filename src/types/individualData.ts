
export interface EmployeeStats {
  habitsCompletionRate: number;
  tasksCompletionRate: number;
  outputsCompletionRate: number;
  bestStreak: number;
  currentStreak: number;
}

export interface OverdueTask {
  id: string;
  title: string;
  daysOverdue: number;
  priority: string;
  originalDueDate?: string;
}

export interface OverdueOutput {
  id: string;
  title: string;
  progress: number;
  daysOverdue: number;
  originalDueDate?: string;
}

export interface Habit {
  name: string;
  completed: boolean;
  streak: number;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
  priority: string;
}

export interface WeeklyOutput {
  id: string;
  title: string;
  progress: number;
  dueDate: string;
}

export interface MoodData {
  date: string;
  mood: number;
}

// Additional type aliases for component props
export type EmployeeHabit = Habit;
export type EmployeeTask = Task;
export type EmployeeWeeklyOutput = WeeklyOutput;

export interface EmployeeData {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
  stats: EmployeeStats;
  overdueTasks: OverdueTask[];
  overdueOutputs: OverdueOutput[];
  habits: Habit[];
  recentTasks: Task[];
  weeklyOutputs: WeeklyOutput[];
  moodData?: MoodData[];
}
