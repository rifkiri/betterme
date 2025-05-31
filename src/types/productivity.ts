
export interface Habit {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
  streak: number;
  category?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  estimatedTime?: string;
  dueDate?: Date;
  createdDate: Date;
  completedDate?: Date;
  originalDueDate?: Date;
  isMoved?: boolean;
}

export interface WeeklyPlan {
  id: string;
  weekStartDate: Date;
  goals: string[];
  tasks: Task[];
  notes?: string;
}
