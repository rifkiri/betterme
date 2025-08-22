
import type { Goal, Task, WeeklyOutput, Habit } from '@/types/productivity';

// Transform database row to Goal type
export const transformGoalRow = (row: any): Goal => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  description: row.description,
  category: row.category,
  subcategory: row.subcategory,
  progress: row.progress,
  deadline: row.deadline ? new Date(row.deadline) : undefined,
  completed: row.completed,
  archived: row.archived,
  isDeleted: row.is_deleted,
  createdDate: new Date(row.created_date),
  coachId: row.coach_id,
  leadIds: row.lead_ids || [],
  memberIds: row.member_ids || [],
  createdBy: row.created_by,
  assignmentDate: row.assignment_date ? new Date(row.assignment_date) : undefined,
});

// Transform Goal type to database row
export const transformGoalToRow = (goal: Partial<Goal>) => ({
  title: goal.title,
  description: goal.description,
  category: goal.category,
  subcategory: goal.subcategory,
  progress: goal.progress,
  deadline: goal.deadline?.toISOString().split('T')[0], // Date only
  completed: goal.completed,
  archived: goal.archived,
  user_id: goal.userId,
  coach_id: goal.coachId,
  lead_ids: goal.leadIds,
  member_ids: goal.memberIds,
  created_by: goal.createdBy,
  assignment_date: goal.assignmentDate?.toISOString(),
});

// Transform database row to Task type
export const transformTaskRow = (row: any): Task => ({
  id: row.id,
  userId: row.user_id,
  projectId: row.project_id,
  weeklyOutputId: row.weekly_output_id,
  title: row.title,
  description: row.description,
  dueDate: new Date(row.due_date),
  priority: row.priority as Task['priority'], // Ensure proper typing
  taggedUsers: row.tagged_users || [],
  completed: row.completed,
  isMoved: row.is_moved,
  originalDueDate: row.original_due_date ? new Date(row.original_due_date) : undefined,
  isDeleted: row.is_deleted,
  deletedDate: row.deleted_date ? new Date(row.deleted_date) : undefined,
  completedDate: row.completed_date ? new Date(row.completed_date) : undefined,
  createdDate: new Date(row.created_date),
});

// Transform Task type to database row
export const transformTaskToRow = (task: Partial<Task>) => ({
  title: task.title,
  description: task.description,
  due_date: task.dueDate?.toISOString().split('T')[0], // Date only
  priority: task.priority, // Keep as-is since it should match the database enum
  tagged_users: task.taggedUsers,
  completed: task.completed,
  user_id: task.userId,
  project_id: task.projectId,
  weekly_output_id: task.weeklyOutputId,
  is_moved: task.isMoved,
  original_due_date: task.originalDueDate?.toISOString().split('T')[0],
  completed_date: task.completedDate?.toISOString(),
});

// Transform database row to WeeklyOutput type
export const transformWeeklyOutputRow = (row: any): WeeklyOutput => ({
  id: row.id,
  userId: row.user_id,
  projectId: row.project_id,
  title: row.title,
  description: row.description,
  dueDate: new Date(row.due_date),
  progress: row.progress,
  isMoved: row.is_moved,
  originalDueDate: row.original_due_date ? new Date(row.original_due_date) : undefined,
  isDeleted: row.is_deleted,
  deletedDate: row.deleted_date ? new Date(row.deleted_date) : undefined,
  completedDate: row.completed_date ? new Date(row.completed_date) : undefined,
  createdDate: new Date(row.created_date),
});

// Transform WeeklyOutput type to database row
export const transformWeeklyOutputToRow = (output: Partial<WeeklyOutput>) => ({
  title: output.title,
  description: output.description,
  due_date: output.dueDate?.toISOString().split('T')[0], // Date only
  progress: output.progress,
  user_id: output.userId,
  project_id: output.projectId,
  is_moved: output.isMoved,
  original_due_date: output.originalDueDate?.toISOString().split('T')[0],
  completed_date: output.completedDate?.toISOString(),
});

// Transform database row to Habit type
export const transformHabitRow = (row: any): Habit => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  description: row.description,
  category: row.category as Habit['category'], // Ensure proper typing
  streak: row.streak,
  archived: row.archived,
  isDeleted: row.is_deleted,
  completed: row.completed,
  lastCompletedDate: row.last_completed_date ? new Date(row.last_completed_date) : undefined,
  createdAt: row.created_at,
});

// Transform Habit type to database row with category validation
export const transformHabitToRow = (habit: Partial<Habit>) => {
  // Validate category or default to 'other'
  const validCategories = [
    'health', 'productivity', 'personal', 'fitness', 'learning', 'other',
    'mental', 'relationship', 'social', 'spiritual', 'wealth'
  ];
  
  const category = habit.category && validCategories.includes(habit.category) 
    ? habit.category 
    : 'other';

  return {
    name: habit.name,
    description: habit.description,
    category: category,
    streak: habit.streak,
    archived: habit.archived,
    user_id: habit.userId,
    completed: habit.completed,
    last_completed_date: habit.lastCompletedDate?.toISOString().split('T')[0], // Date only
  };
};
