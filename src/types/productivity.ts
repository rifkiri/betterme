
export interface Habit {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
  streak: number;
  category?: string;
  archived?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  estimatedTime?: string;
  createdDate: Date;
  completedDate?: Date;
  weeklyOutputId?: string;
}

export interface WeeklyPlan {
  id: string;
  weekStartDate: Date;
  goals: string[];
  tasks: Task[];
  notes?: string;
}

export interface WeeklyOutput {
  id: string;
  title: string;
  progress: number;
  createdDate: Date;
  dueDate?: Date;
  deletedDate?: Date;
  isDeleted?: boolean;
}
