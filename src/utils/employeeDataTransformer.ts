
import { EmployeeData } from '@/types/individualData';
import { User } from '@/types/userTypes';

export const transformToEmployeeData = (
  member: User,
  habits: any[],
  tasks: any[],
  outputs: any[]
): EmployeeData => {
  const today = new Date();
  
  // Generate overdue items
  const overdueTasks = tasks.filter(task => 
    !task.completed && !task.isDeleted && task.dueDate && task.dueDate < today
  ).map(task => ({
    id: task.id,
    title: task.title,
    priority: task.priority as 'High' | 'Medium' | 'Low',
    daysOverdue: Math.floor((today.getTime() - task.dueDate!.getTime()) / (1000 * 60 * 60 * 24)),
    originalDueDate: task.dueDate!.toISOString().split('T')[0]
  }));
  
  const overdueOutputs = outputs.filter(output => 
    output.progress < 100 && !output.isDeleted && output.dueDate && output.dueDate < today
  ).map(output => ({
    id: output.id,
    title: output.title,
    progress: output.progress,
    daysOverdue: Math.floor((today.getTime() - output.dueDate!.getTime()) / (1000 * 60 * 60 * 24)),
    originalDueDate: output.dueDate!.toISOString().split('T')[0]
  }));
  
  // Recent tasks (last 10)
  const recentTasks = tasks
    .filter(task => !task.isDeleted)
    .sort((a, b) => (b.createdDate?.getTime() || 0) - (a.createdDate?.getTime() || 0))
    .slice(0, 10)
    .map(task => ({
      id: task.id,
      title: task.title,
      completed: task.completed,
      dueDate: task.dueDate?.toISOString().split('T')[0] || '',
      priority: task.priority as 'High' | 'Medium' | 'Low'
    }));
  
  // Weekly outputs for current week
  const weeklyOutputs = outputs
    .filter(output => !output.isDeleted)
    .map(output => ({
      id: output.id,
      title: output.title,
      progress: output.progress,
      dueDate: output.dueDate?.toISOString().split('T')[0] || ''
    }));

  // Calculate completion rates for stats
  const completedHabits = habits.filter(h => h.completed && !h.archived).length;
  const totalHabits = habits.filter(h => !h.archived).length;
  const habitsCompletionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
  
  const completedTasks = tasks.filter(t => t.completed && !t.isDeleted).length;
  const totalTasks = tasks.filter(t => !t.isDeleted).length;
  const tasksCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const completedOutputs = outputs.filter(o => o.progress === 100 && !o.isDeleted).length;
  const totalOutputs = outputs.filter(o => !o.isDeleted).length;
  const outputsCompletionRate = totalOutputs > 0 ? Math.round((completedOutputs / totalOutputs) * 100) : 0;
  
  const maxStreak = Math.max(...habits.map(h => h.streak), 0);
  const currentStreak = habits.filter(h => h.completed).reduce((sum, h) => sum + h.streak, 0) / Math.max(habits.filter(h => h.completed).length, 1);
  
  return {
    id: member.id,
    name: member.name,
    role: member.position || 'Team Member',
    email: member.email,
    avatar: member.name.charAt(0).toUpperCase(),
    stats: {
      habitsCompletionRate,
      tasksCompletionRate,
      outputsCompletionRate,
      bestStreak: Math.round(maxStreak),
      currentStreak: Math.round(currentStreak)
    },
    overdueTasks,
    overdueOutputs,
    habits: habits.filter(h => !h.archived).map(habit => ({
      name: habit.name,
      completed: habit.completed,
      streak: habit.streak
    })),
    recentTasks,
    weeklyOutputs
  };
};
