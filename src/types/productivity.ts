export interface Habit {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  completed: boolean;
  streak: number;
  category?: string;
  archived?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
}

export interface Task {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  completed: boolean;
  estimatedTime?: string;
  createdDate: Date;
  dueDate: Date;
  originalDueDate?: Date;
  completedDate?: Date;
  isMoved: boolean;
  isDeleted?: boolean;
  deletedDate?: Date;
  weeklyOutputId?: string;
  taggedUsers?: string[]; // Array of user IDs who are tagged for support
}

export interface WeeklyPlan {
  id: string;
  userId?: string;
  week: string;
  weekStartDate: Date;
  goals: string[];
  priorities: string[];
  notes?: string;
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyOutput {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  progress: number;
  createdDate: Date;
  dueDate: Date;
  originalDueDate?: Date;
  completedDate?: Date;
  isMoved?: boolean;
  isDeleted?: boolean;
  deletedDate?: Date;
  linkedGoalIds?: string[]; // Link to goals
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  category: 'daily' | 'weekly' | 'monthly' | 'custom';
  deadline?: Date;
  createdDate: Date;
  completed: boolean;
  archived: boolean;
  progress: number; // 0-100, calculated from currentValue/targetValue
  linkedOutputIds?: string[]; // Link to weekly outputs
}

export interface MoodEntry {
  id: string;
  userId?: string;
  date: string;
  mood: number;
  notes?: string;
}
