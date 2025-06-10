import { EmployeeData } from '@/types/individualData';
import { Habit, Task, WeeklyOutput } from '@/types/productivity';

export const transformEmployeeDataForDashboard = (employee: EmployeeData) => {
  // Transform employee data to match productivity types
  const transformedHabits: Habit[] = employee.habits.map(h => ({
    id: `habit-${h.name}`,
    name: h.name,
    completed: h.completed,
    streak: h.streak,
    category: '',
    description: '',
    userId: employee.id,
    archived: false,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  const transformedTasks: Task[] = employee.recentTasks.map(t => ({
    id: t.id,
    title: t.title,
    completed: t.completed,
    dueDate: new Date(t.dueDate),
    priority: t.priority as 'Low' | 'Medium' | 'High',
    description: '',
    userId: employee.id,
    isDeleted: false,
    createdDate: new Date(),
    updatedAt: new Date(),
    originalDueDate: new Date(t.dueDate),
    isMoved: false
  }));

  const transformedOverdueTasks: Task[] = employee.overdueTasks.map(t => ({
    id: t.id,
    title: t.title,
    completed: false,
    dueDate: new Date(t.originalDueDate || new Date()),
    priority: t.priority as 'Low' | 'Medium' | 'High',
    description: '',
    userId: employee.id,
    isDeleted: false,
    createdDate: new Date(),
    updatedAt: new Date(),
    originalDueDate: new Date(t.originalDueDate || new Date()),
    isMoved: false
  }));

  const transformedWeeklyOutputs: WeeklyOutput[] = employee.weeklyOutputs.map(o => ({
    id: o.id,
    title: o.title,
    progress: o.progress,
    dueDate: new Date(o.dueDate),
    description: '',
    userId: employee.id,
    isDeleted: false,
    createdDate: new Date(),
    updatedAt: new Date(),
    originalDueDate: new Date(o.dueDate)
  }));

  const transformedOverdueOutputs: WeeklyOutput[] = employee.overdueOutputs.map(o => ({
    id: o.id,
    title: o.title,
    progress: o.progress,
    dueDate: new Date(o.originalDueDate || new Date()),
    description: '',
    userId: employee.id,
    isDeleted: false,
    createdDate: new Date(),
    updatedAt: new Date(),
    originalDueDate: new Date(o.originalDueDate || new Date())
  }));

  return {
    transformedHabits,
    transformedTasks,
    transformedOverdueTasks,
    transformedWeeklyOutputs,
    transformedOverdueOutputs
  };
};

// Create read-only handlers that prevent any modifications
export const createReadOnlyHandlers = () => ({
  handleDateChange: () => {}, // This will be overridden with actual date change handler
  addHabit: () => console.log('View-only mode: Cannot add habits'),
  editHabit: () => console.log('View-only mode: Cannot edit habits'),
  addTask: () => console.log('View-only mode: Cannot add tasks'),
  editTask: () => console.log('View-only mode: Cannot edit tasks'),
  addWeeklyOutput: () => console.log('View-only mode: Cannot add weekly outputs'),
  editWeeklyOutput: () => console.log('View-only mode: Cannot edit weekly outputs'),
  toggleHabit: () => console.log('View-only mode: Cannot toggle habits'),
  toggleTask: () => console.log('View-only mode: Cannot toggle tasks'),
  deleteTask: () => console.log('View-only mode: Cannot delete tasks'),
  restoreTask: () => console.log('View-only mode: Cannot restore tasks'),
  permanentlyDeleteTask: () => console.log('View-only mode: Cannot permanently delete tasks'),
  archiveHabit: () => console.log('View-only mode: Cannot archive habits'),
  restoreHabit: () => console.log('View-only mode: Cannot restore habits'),
  permanentlyDeleteHabit: () => console.log('View-only mode: Cannot permanently delete habits'),
  rollOverTask: () => console.log('View-only mode: Cannot roll over tasks'),
  updateProgress: () => console.log('View-only mode: Cannot update progress'),
  moveWeeklyOutput: () => console.log('View-only mode: Cannot move weekly outputs'),
  deleteWeeklyOutput: () => console.log('View-only mode: Cannot delete weekly outputs'),
  restoreWeeklyOutput: () => console.log('View-only mode: Cannot restore weekly outputs'),
  permanentlyDeleteWeeklyOutput: () => console.log('View-only mode: Cannot permanently delete weekly outputs'),
  moveTask: () => console.log('View-only mode: Cannot move tasks'),
});

// Keep the old function for backward compatibility
export const createMockHandlers = createReadOnlyHandlers;
