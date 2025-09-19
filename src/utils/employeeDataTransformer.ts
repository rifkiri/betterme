
import { EmployeeData } from '@/types/individualData';
import { User } from '@/types/userTypes';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { isTaskOverdue, isWeeklyOutputOverdue } from '@/utils/dateUtils';
import { differenceInDays } from 'date-fns';

export const transformToEmployeeData = (
  user: User, 
  habits: any[], 
  tasks: any[], 
  outputs: any[],
  moodData: any[] = []
): EmployeeData => {
  // Calculate completion rates
  const completedHabits = habits.filter(h => h.completed && !h.archived).length;
  const totalHabits = habits.filter(h => !h.archived).length;
  const habitsCompletionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  const completedTasks = tasks.filter(t => t.completed && !t.isDeleted).length;
  const totalTasks = tasks.filter(t => !t.isDeleted).length;
  const tasksCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const completedOutputs = outputs.filter(o => o.progress === 100 && !o.isDeleted).length;
  const totalOutputs = outputs.filter(o => !o.isDeleted).length;
  const outputsCompletionRate = totalOutputs > 0 ? Math.round((completedOutputs / totalOutputs) * 100) : 0;

  // Calculate streaks
  const streaks = habits.map(h => h.streak || 0);
  const bestStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
  const currentStreak = habits.filter(h => h.completed).reduce((sum, h) => sum + (h.streak || 0), 0);

  // Get overdue items
  const today = new Date();
  const overdueTasks = tasks.filter(t => 
    !t.completed && !t.isDeleted && t.dueDate && isTaskOverdue(new Date(t.dueDate))
  ).map(t => ({
    id: t.id,
    title: t.title,
    daysOverdue: Math.max(0, differenceInDays(today, new Date(t.dueDate))),
    priority: t.priority || 'Medium',
    originalDueDate: t.originalDueDate || t.dueDate
  }));

  const overdueOutputs = outputs.filter(o => 
    !o.isDeleted && o.dueDate && isWeeklyOutputOverdue(
      new Date(o.dueDate), 
      o.progress || 0,
      o.completedDate ? new Date(o.completedDate) : undefined,
      o.createdAt ? new Date(o.createdAt) : undefined
    )
  ).map(o => ({
    id: o.id,
    title: o.title,
    progress: o.progress,
    daysOverdue: Math.max(0, differenceInDays(today, new Date(o.dueDate))),
    originalDueDate: o.originalDueDate || o.dueDate
  }));

  // Transform mood data for the chart
  const transformedMoodData = moodData.map(entry => ({
    date: entry.date,
    mood: entry.mood
  }));

  return {
    id: user.id,
    name: user.name,
    role: user.position || 'Team Member',
    email: user.email,
    avatar: user.name.charAt(0).toUpperCase(),
    stats: {
      habitsCompletionRate,
      tasksCompletionRate,
      outputsCompletionRate,
      bestStreak,
      currentStreak
    },
    overdueTasks,
    overdueOutputs,
    habits: habits.filter(h => !h.archived).map(h => ({
      name: h.name,
      completed: h.completed,
      streak: h.streak || 0
    })),
    recentTasks: tasks.filter(t => !t.isDeleted).slice(0, 5).map(t => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      dueDate: t.dueDate,
      priority: t.priority || 'Medium'
    })),
    weeklyOutputs: outputs.filter(o => !o.isDeleted).map(o => ({
      id: o.id,
      title: o.title,
      progress: o.progress,
      dueDate: o.dueDate
    })),
    moodData: transformedMoodData
  };
};

export const transformUserToEmployeeData = async (user: User): Promise<EmployeeData> => {
  try {
    // Fetch all data for the user
    const [habits, tasks, outputs, moodData] = await Promise.all([
      supabaseDataService.getHabits(user.id),
      supabaseDataService.getTasks(user.id),
      supabaseDataService.getWeeklyOutputs(user.id),
      supabaseDataService.getMoodData(user.id)
    ]);
    
    // Use the existing transform function
    return transformToEmployeeData(user, habits, tasks, outputs, moodData);
  } catch (error) {
    console.error(`Error transforming user data for ${user.name}:`, error);
    throw error;
  }
};
