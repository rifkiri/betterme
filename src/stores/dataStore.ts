import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { Goal, Task, WeeklyOutput, Habit } from '@/types/productivity';

interface DataState {
  goals: Goal[];
  tasks: Task[];
  weeklyOutputs: WeeklyOutput[];
  habits: Habit[];
  selectedDate: Date;
  isLoading: boolean;
}

interface DataActions {
  setGoals: (goals: Goal[]) => void;
  setTasks: (tasks: Task[]) => void;
  setWeeklyOutputs: (outputs: WeeklyOutput[]) => void;
  setHabits: (habits: Habit[]) => void;
  setSelectedDate: (date: Date) => void;
  setLoading: (loading: boolean) => void;
  loadAllData: (userId: string, date?: Date) => Promise<void>;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  addWeeklyOutput: (output: WeeklyOutput) => void;
  updateWeeklyOutput: (id: string, updates: Partial<WeeklyOutput>) => void;
  removeWeeklyOutput: (id: string) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  removeHabit: (id: string) => void;
}

export const useDataStore = create<DataState & DataActions>((set, get) => ({
  goals: [],
  tasks: [],
  weeklyOutputs: [],
  habits: [],
  selectedDate: new Date(),
  isLoading: false,

  setGoals: (goals) => set({ goals }),
  setTasks: (tasks) => set({ tasks }),
  setWeeklyOutputs: (weeklyOutputs) => set({ weeklyOutputs }),
  setHabits: (habits) => set({ habits }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setLoading: (isLoading) => set({ isLoading }),

  loadAllData: async (userId: string, date?: Date) => {
    set({ isLoading: true });
    const targetDate = date || get().selectedDate;

    try {
      const [goalsRes, tasksRes, outputsRes, habitsRes] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', userId).eq('is_deleted', false),
        supabase.from('tasks').select('*').eq('user_id', userId).eq('is_deleted', false),
        supabase.from('weekly_outputs').select('*').eq('user_id', userId).eq('is_deleted', false),
        supabase.from('habits').select('*').eq('user_id', userId).eq('is_deleted', false).eq('archived', false),
      ]);

      if (goalsRes.data) set({ goals: goalsRes.data as Goal[] });
      if (tasksRes.data) set({ tasks: tasksRes.data as Task[] });
      if (outputsRes.data) set({ weeklyOutputs: outputsRes.data as WeeklyOutput[] });
      if (habitsRes.data) set({ habits: habitsRes.data as Habit[] });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addGoal: (goal) => set({ goals: [...get().goals, goal] }),
  updateGoal: (id, updates) => set({
    goals: get().goals.map(g => g.id === id ? { ...g, ...updates } : g)
  }),
  removeGoal: (id) => set({ goals: get().goals.filter(g => g.id !== id) }),

  addTask: (task) => set({ tasks: [...get().tasks, task] }),
  updateTask: (id, updates) => set({
    tasks: get().tasks.map(t => t.id === id ? { ...t, ...updates } : t)
  }),
  removeTask: (id) => set({ tasks: get().tasks.filter(t => t.id !== id) }),

  addWeeklyOutput: (output) => set({ weeklyOutputs: [...get().weeklyOutputs, output] }),
  updateWeeklyOutput: (id, updates) => set({
    weeklyOutputs: get().weeklyOutputs.map(w => w.id === id ? { ...w, ...updates } : w)
  }),
  removeWeeklyOutput: (id) => set({ weeklyOutputs: get().weeklyOutputs.filter(w => w.id !== id) }),

  addHabit: (habit) => set({ habits: [...get().habits, habit] }),
  updateHabit: (id, updates) => set({
    habits: get().habits.map(h => h.id === id ? { ...h, ...updates } : h)
  }),
  removeHabit: (id) => set({ habits: get().habits.filter(h => h.id !== id) }),
}));