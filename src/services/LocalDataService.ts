
import { User } from '@/types/userTypes';
import { Habit, Task, WeeklyOutput } from '@/types/productivity';

interface MoodEntry {
  id: string;
  userId: string;
  date: string;
  mood: number;
  notes?: string;
}

class LocalDataService {
  // Initialize with dummy data
  private initializeData() {
    if (!localStorage.getItem('localUsers')) {
      const dummyUsers: User[] = [
        {
          id: '1',
          name: 'John Admin',
          email: 'admin@company.com',
          role: 'admin',
          position: 'System Administrator',
          temporaryPassword: 'admin123',
          hasChangedPassword: true,
          userStatus: 'active',
          createdAt: '2024-01-15',
          lastLogin: '2024-06-01'
        },
        {
          id: '2',
          name: 'Sarah Manager',
          email: 'sarah@company.com',
          role: 'manager',
          position: 'Team Lead',
          temporaryPassword: 'manager123',
          hasChangedPassword: true,
          userStatus: 'active',
          createdAt: '2024-01-20',
          lastLogin: '2024-06-01'
        },
        {
          id: '3',
          name: 'Mike Developer',
          email: 'mike@company.com',
          role: 'team-member',
          position: 'Senior Developer',
          temporaryPassword: 'dev123',
          hasChangedPassword: false,
          userStatus: 'pending',
          createdAt: '2024-02-01',
          lastLogin: '2024-05-30'
        },
        {
          id: '4',
          name: 'Lisa Designer',
          email: 'lisa@company.com',
          role: 'team-member',
          position: 'UI/UX Designer',
          temporaryPassword: 'design123',
          hasChangedPassword: true,
          userStatus: 'active',
          createdAt: '2024-02-15',
          lastLogin: '2024-05-29'
        }
      ];
      localStorage.setItem('localUsers', JSON.stringify(dummyUsers));
    }

    if (!localStorage.getItem('localHabits')) {
      const dummyHabits: (Habit & { userId: string })[] = [
        {
          id: 'h1',
          userId: '3',
          name: 'Morning Exercise',
          description: 'Start day with 30 minutes workout',
          completed: true,
          streak: 15,
          category: 'Health',
          archived: false,
          isDeleted: false,
          createdAt: '2024-05-01'
        },
        {
          id: 'h2',
          userId: '3',
          name: 'Read Technical Articles',
          description: 'Stay updated with latest tech trends',
          completed: false,
          streak: 8,
          category: 'Learning',
          archived: false,
          isDeleted: false,
          createdAt: '2024-05-05'
        },
        {
          id: 'h3',
          userId: '4',
          name: 'Daily Sketching',
          description: 'Practice design skills',
          completed: true,
          streak: 22,
          category: 'Creativity',
          archived: false,
          isDeleted: false,
          createdAt: '2024-04-20'
        }
      ];
      localStorage.setItem('localHabits', JSON.stringify(dummyHabits));
    }

    if (!localStorage.getItem('localTasks')) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const dummyTasks: (Task & { userId: string })[] = [
        {
          id: 't1',
          userId: '3',
          title: 'Fix login bug',
          description: 'Resolve authentication issue in production',
          priority: 'High',
          completed: false,
          estimatedTime: '2 hours',
          createdDate: yesterday,
          dueDate: today,
          originalDueDate: today,
          isMoved: false,
          isDeleted: false
        },
        {
          id: 't2',
          userId: '3',
          title: 'Code review for feature X',
          description: 'Review pull request from team member',
          priority: 'Medium',
          completed: true,
          estimatedTime: '1 hour',
          createdDate: yesterday,
          dueDate: yesterday,
          originalDueDate: yesterday,
          completedDate: yesterday,
          isMoved: false,
          isDeleted: false
        },
        {
          id: 't3',
          userId: '4',
          title: 'Design new dashboard mockups',
          description: 'Create wireframes for analytics dashboard',
          priority: 'High',
          completed: false,
          estimatedTime: '4 hours',
          createdDate: today,
          dueDate: tomorrow,
          originalDueDate: tomorrow,
          isMoved: false,
          isDeleted: false
        },
        {
          id: 't4',
          userId: '3',
          title: 'Update documentation',
          description: 'Update API documentation',
          priority: 'Low',
          completed: false,
          estimatedTime: '3 hours',
          createdDate: new Date('2024-05-28'),
          dueDate: new Date('2024-05-30'),
          originalDueDate: new Date('2024-05-30'),
          isMoved: false,
          isDeleted: false
        }
      ];
      localStorage.setItem('localTasks', JSON.stringify(dummyTasks));
    }

    if (!localStorage.getItem('localWeeklyOutputs')) {
      const thisWeek = new Date();
      const nextWeek = new Date(thisWeek);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const dummyOutputs: (WeeklyOutput & { userId: string })[] = [
        {
          id: 'w1',
          userId: '3',
          title: 'Complete authentication system',
          progress: 75,
          createdDate: new Date('2024-05-27'),
          dueDate: thisWeek,
          originalDueDate: thisWeek,
          isMoved: false,
          isDeleted: false
        },
        {
          id: 'w2',
          userId: '4',
          title: 'Redesign user onboarding flow',
          progress: 90,
          createdDate: new Date('2024-05-25'),
          dueDate: thisWeek,
          originalDueDate: thisWeek,
          isMoved: false,
          isDeleted: false
        },
        {
          id: 'w3',
          userId: '3',
          title: 'Implement payment integration',
          progress: 25,
          createdDate: thisWeek,
          dueDate: nextWeek,
          originalDueDate: nextWeek,
          isMoved: false,
          isDeleted: false
        }
      ];
      localStorage.setItem('localWeeklyOutputs', JSON.stringify(dummyOutputs));
    }

    if (!localStorage.getItem('localMoodEntries')) {
      const dummyMoodEntries: MoodEntry[] = [
        {
          id: 'm1',
          userId: '3',
          date: '2024-06-01',
          mood: 4,
          notes: 'Great day, solved a complex bug'
        },
        {
          id: 'm2',
          userId: '3',
          date: '2024-05-31',
          mood: 3,
          notes: 'Normal day, steady progress'
        },
        {
          id: 'm3',
          userId: '4',
          date: '2024-06-01',
          mood: 5,
          notes: 'Excellent design session, very creative'
        },
        {
          id: 'm4',
          userId: '4',
          date: '2024-05-31',
          mood: 4,
          notes: 'Good feedback from stakeholders'
        }
      ];
      localStorage.setItem('localMoodEntries', JSON.stringify(dummyMoodEntries));
    }
  }

  constructor() {
    this.initializeData();
  }

  // User methods
  getUsers(): User[] {
    const data = localStorage.getItem('localUsers');
    return data ? JSON.parse(data) : [];
  }

  addUser(user: User): void {
    const users = this.getUsers();
    users.push(user);
    localStorage.setItem('localUsers', JSON.stringify(users));
  }

  updateUser(userId: string, updates: Partial<User>): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      localStorage.setItem('localUsers', JSON.stringify(users));
    }
  }

  deleteUser(userId: string): void {
    const users = this.getUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('localUsers', JSON.stringify(filteredUsers));
  }

  // Habit methods
  getHabits(userId: string): Habit[] {
    const data = localStorage.getItem('localHabits');
    const allHabits: (Habit & { userId: string })[] = data ? JSON.parse(data) : [];
    return allHabits.filter(h => h.userId === userId).map(({ userId, ...habit }) => habit);
  }

  addHabit(habit: Habit & { userId: string }): void {
    const data = localStorage.getItem('localHabits');
    const habits = data ? JSON.parse(data) : [];
    habits.push(habit);
    localStorage.setItem('localHabits', JSON.stringify(habits));
  }

  updateHabit(id: string, userId: string, updates: Partial<Habit>): void {
    const data = localStorage.getItem('localHabits');
    const habits = data ? JSON.parse(data) : [];
    const index = habits.findIndex((h: any) => h.id === id && h.userId === userId);
    if (index !== -1) {
      habits[index] = { ...habits[index], ...updates };
      localStorage.setItem('localHabits', JSON.stringify(habits));
    }
  }

  // Task methods
  getTasks(userId: string): Task[] {
    const data = localStorage.getItem('localTasks');
    const allTasks: (Task & { userId: string })[] = data ? JSON.parse(data) : [];
    return allTasks.filter(t => t.userId === userId).map(({ userId, ...task }) => ({
      ...task,
      createdDate: new Date(task.createdDate),
      dueDate: new Date(task.dueDate),
      originalDueDate: task.originalDueDate ? new Date(task.originalDueDate) : undefined,
      completedDate: task.completedDate ? new Date(task.completedDate) : undefined,
      deletedDate: task.deletedDate ? new Date(task.deletedDate) : undefined
    }));
  }

  addTask(task: Task & { userId: string }): void {
    const data = localStorage.getItem('localTasks');
    const tasks = data ? JSON.parse(data) : [];
    tasks.push(task);
    localStorage.setItem('localTasks', JSON.stringify(tasks));
  }

  updateTask(id: string, userId: string, updates: Partial<Task>): void {
    const data = localStorage.getItem('localTasks');
    const tasks = data ? JSON.parse(data) : [];
    const index = tasks.findIndex((t: any) => t.id === id && t.userId === userId);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      localStorage.setItem('localTasks', JSON.stringify(tasks));
    }
  }

  // Weekly Output methods
  getWeeklyOutputs(userId: string): WeeklyOutput[] {
    const data = localStorage.getItem('localWeeklyOutputs');
    const allOutputs: (WeeklyOutput & { userId: string })[] = data ? JSON.parse(data) : [];
    return allOutputs.filter(w => w.userId === userId).map(({ userId, ...output }) => ({
      ...output,
      createdDate: new Date(output.createdDate),
      dueDate: output.dueDate ? new Date(output.dueDate) : undefined,
      originalDueDate: output.originalDueDate ? new Date(output.originalDueDate) : undefined,
      completedDate: output.completedDate ? new Date(output.completedDate) : undefined,
      deletedDate: output.deletedDate ? new Date(output.deletedDate) : undefined
    }));
  }

  addWeeklyOutput(output: WeeklyOutput & { userId: string }): void {
    const data = localStorage.getItem('localWeeklyOutputs');
    const outputs = data ? JSON.parse(data) : [];
    outputs.push(output);
    localStorage.setItem('localWeeklyOutputs', JSON.stringify(outputs));
  }

  updateWeeklyOutput(id: string, userId: string, updates: Partial<WeeklyOutput>): void {
    const data = localStorage.getItem('localWeeklyOutputs');
    const outputs = data ? JSON.parse(data) : [];
    const index = outputs.findIndex((w: any) => w.id === id && w.userId === userId);
    if (index !== -1) {
      outputs[index] = { ...outputs[index], ...updates };
      localStorage.setItem('localWeeklyOutputs', JSON.stringify(outputs));
    }
  }

  // Mood methods
  getMoodData(userId: string): MoodEntry[] {
    const data = localStorage.getItem('localMoodEntries');
    const allEntries: MoodEntry[] = data ? JSON.parse(data) : [];
    return allEntries.filter(m => m.userId === userId);
  }

  addMoodEntry(entry: MoodEntry): void {
    const data = localStorage.getItem('localMoodEntries');
    const entries = data ? JSON.parse(data) : [];
    entries.push(entry);
    localStorage.setItem('localMoodEntries', JSON.stringify(entries));
  }

  updateMoodEntry(id: string, userId: string, updates: Partial<MoodEntry>): void {
    const data = localStorage.getItem('localMoodEntries');
    const entries = data ? JSON.parse(data) : [];
    const index = entries.findIndex((m: any) => m.id === id && m.userId === userId);
    if (index !== -1) {
      entries[index] = { ...entries[index], ...updates };
      localStorage.setItem('localMoodEntries', JSON.stringify(entries));
    }
  }

  // Configuration methods
  isConfigured(): boolean {
    return true; // Always configured for local storage
  }

  isAuthenticated(): boolean {
    return true; // Always authenticated for local storage
  }
}

export const localDataService = new LocalDataService();
