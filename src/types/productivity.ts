
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
}
