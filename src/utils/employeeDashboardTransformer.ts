
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

export const createMockHandlers = () => ({
  handleDateChange: () => {},
  addHabit: () => {},
  editHabit: () => {},
  addTask: () => {},
  editTask: () => {},
  addWeeklyOutput: () => {},
  editWeeklyOutput: () => {},
  toggleHabit: () => {},
  toggleTask: () => {},
  deleteTask: () => {},
  restoreTask: () => {},
  permanentlyDeleteTask: () => {},
  archiveHabit: () => {},
  restoreHabit: () => {},
  permanentlyDeleteHabit: () => {},
  rollOverTask: () => {},
  updateProgress: () => {},
  moveWeeklyOutput: () => {},
  deleteWeeklyOutput: () => {},
  restoreWeeklyOutput: () => {},
  permanentlyDeleteWeeklyOutput: () => {},
  moveTask: () => {},
});
