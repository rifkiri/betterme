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
  linkedGoalId?: string;
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
  linkedGoalId?: string;
}

export interface Goal {
  id: string;
  userId?: string; // Owner of the goal
  title: string;
  description?: string;
  category: 'work' | 'personal';
  subcategory?: string; // Subcategory for more specific classification
  deadline?: Date;
  createdDate: Date;
  completed: boolean;
  archived: boolean;
  progress: number; // 0-100, manually controlled
  // linkedOutputIds removed - now handled by ItemLinkageService
  coachId?: string; // Manager responsible for goal oversight
  leadIds?: string[]; // Users leading goal execution (managers or team members)
  memberIds?: string[]; // Users executing goal tasks (managers or team members)  
  createdBy?: string; // Manager who created the work goal
  assignmentDate?: Date;
}

export interface GoalAssignment {
  id: string;
  goalId: string;
  userId: string;
  role: 'coach' | 'lead' | 'member';
  assignedBy: string;
  assignedDate: Date;
  acknowledged: boolean;
  selfAssigned: boolean;
}

export interface GoalNotification {
  id: string;
  userId: string;
  goalId: string;
  notificationType: 'assignment' | 'self_assignment';
  role: 'coach' | 'lead' | 'member';
  acknowledged: boolean;
  createdDate: Date;
}

export interface MoodEntry {
  id: string;
  userId?: string;
  date: string;
  mood: number;
  notes?: string;
}
