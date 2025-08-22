
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
  lastCompletedDate?: Date;
  linkedGoalId?: string;
}

export interface Task {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
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
  taggedUsers?: string[];
  projectId?: string;
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
  projectId?: string;
}

export interface Goal {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  category: 'work' | 'personal';
  subcategory?: string;
  deadline?: Date;
  createdDate: Date;
  completed: boolean;
  archived: boolean;
  isDeleted?: boolean;
  progress: number;
  coachId?: string;
  leadIds?: string[];
  memberIds?: string[];
  createdBy?: string;
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
