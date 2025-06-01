
export interface Habit {
  id: string;
  userId?: string;
  name: string;
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
}

export interface WeeklyPlan {
  id: string;
  userId?: string;
  week: string;
  goals: string[];
  priorities: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyOutput {
  id: string;
  userId?: string;
  title: string;
  progress: number;
  createdDate: Date;
  dueDate: Date;
  originalDueDate?: Date;
  completedDate?: Date;
  isMoved?: boolean;
  isDeleted?: boolean;
  deletedDate?: Date;
}

export interface MoodEntry {
  id: string;
  userId?: string;
  date: string;
  mood: number;
  notes?: string;
}
