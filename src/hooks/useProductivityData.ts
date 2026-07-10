import { useState, useEffect, useRef } from 'react';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { Habit, Task, WeeklyOutput, Goal } from '@/types/productivity';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

// ---- Module-level cache ---------------------------------------------------
// Every page mounts its own useProductivityData() and used to refetch
// everything on every navigation. We cache the last snapshot per (user,date)
// and reuse it within CACHE_TTL_MS, then quietly refresh in the background.
const CACHE_TTL_MS = 30_000;

type Snapshot = {
  habitsData: Habit[];
  tasksData: Task[];
  weeklyOutputsData: WeeklyOutput[];
  goalsData: Goal[];
  allGoalsData: Goal[];
  deletedGoalsForAdmin: Goal[];
  fetchedAt: number;
};

const snapshotCache = new Map<string, Snapshot>();
const inflightFetches = new Map<string, Promise<Snapshot>>();

const cacheKey = (userId: string, dateStr: string, role: string | null) =>
  `${userId}|${dateStr}|${role ?? ''}`;

const fetchSnapshot = async (
  userId: string,
  date: Date,
  role: string | null
): Promise<Snapshot> => {
  const [habitsData, tasksData, weeklyOutputsData, goalsData, allGoalsData, deletedGoalsForAdmin] =
    await Promise.all([
      supabaseDataService.getHabitsForDate(userId, date),
      supabaseDataService.getTasks(userId),
      supabaseDataService.getWeeklyOutputs(userId),
      supabaseDataService.getGoals(userId),
      supabaseDataService.getAllGoals(),
      role === 'admin' ? supabaseDataService.getDeletedGoalsForAdmin() : Promise.resolve([] as Goal[]),
    ]);
  return {
    habitsData,
    tasksData,
    weeklyOutputsData,
    goalsData,
    allGoalsData,
    deletedGoalsForAdmin,
    fetchedAt: Date.now(),
  };
};

export const invalidateProductivityCache = (userId?: string) => {
  if (!userId) {
    snapshotCache.clear();
    return;
  }
  for (const key of Array.from(snapshotCache.keys())) {
    if (key.startsWith(`${userId}|`)) snapshotCache.delete(key);
  }
};

export const useProductivityData = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weeklyOutputs, setWeeklyOutputs] = useState<WeeklyOutput[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [completedGoals, setCompletedGoals] = useState<Goal[]>([]);
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
  const [deletedWeeklyOutputs, setDeletedWeeklyOutputs] = useState<WeeklyOutput[]>([]);
  const [deletedGoals, setDeletedGoals] = useState<Goal[]>([]);
  const [marketplaceDeletedGoals, setMarketplaceDeletedGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const mountedRef = useRef(true);

  const { user } = useAuth();
  const userId = user?.id || null;
  const { role: userRole } = useUserRole();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const applySnapshot = (snap: Snapshot) => {
    if (!mountedRef.current) return;
    setHabits(snap.habitsData.filter((h) => !h.archived && !h.isDeleted));
    setArchivedHabits(snap.habitsData.filter((h) => h.archived));
    setTasks(snap.tasksData.filter((t) => !t.isDeleted));
    setDeletedTasks(snap.tasksData.filter((t) => t.isDeleted));
    setWeeklyOutputs(snap.weeklyOutputsData.filter((w) => !w.isDeleted));
    setDeletedWeeklyOutputs(snap.weeklyOutputsData.filter((w) => w.isDeleted));
    setGoals(
      snap.goalsData.filter(
        (g) => !g.archived && !g.isDeleted && !g.completed && g.progress < 100
      )
    );
    setDeletedGoals(snap.goalsData.filter((g) => g.archived && !g.isDeleted));
    setAllGoals(
      snap.allGoalsData.filter(
        (g) => !g.archived && !g.isDeleted && !g.completed && g.progress < 100
      )
    );
    setCompletedGoals(
      snap.allGoalsData.filter(
        (g) => !g.archived && !g.isDeleted && (g.completed || g.progress >= 100)
      )
    );
    setMarketplaceDeletedGoals(snap.deletedGoalsForAdmin);
  };

  const isSupabaseAvailable = () =>
    supabaseDataService.isConfigured() && userId !== null;

  const loadAllData = async (date?: Date, opts?: { force?: boolean }) => {
    if (!userId) return;
    if (!isSupabaseAvailable()) {
      toast.error('Please sign in to access your data');
      return;
    }
    const targetDate = date || selectedDate;
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    const key = cacheKey(userId, dateStr, userRole);

    const cached = snapshotCache.get(key);
    const fresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;

    // Fast path: hydrate from cache instantly, then only revalidate in the
    // background if the snapshot is stale or the caller asked to force.
    if (cached) {
      applySnapshot(cached);
      if (fresh && !opts?.force) return;
    } else {
      setIsLoading(true);
    }

    try {
      let inflight = inflightFetches.get(key);
      if (!inflight || opts?.force) {
        inflight = fetchSnapshot(userId, targetDate, userRole);
        inflightFetches.set(key, inflight);
      }
      const snap = await inflight;
      snapshotCache.set(key, snap);
      applySnapshot(snap);
    } catch (error) {
      console.error('Failed to load productivity data:', error);
      if (!cached) toast.error('Failed to load data from Supabase');
    } finally {
      inflightFetches.delete(key);
      if (mountedRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadAllData(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, selectedDate, userRole]);

  const handleDateChange = (date: Date) => setSelectedDate(date);

  // Public loadAllData always forces (mutations use it to refresh after write).
  const loadAllDataForced = (date?: Date) => loadAllData(date, { force: true });

  return {
    habits,
    setHabits,
    tasks,
    setTasks,
    weeklyOutputs,
    setWeeklyOutputs,
    goals,
    setGoals,
    allGoals,
    setAllGoals,
    completedGoals,
    setCompletedGoals,
    archivedHabits,
    setArchivedHabits,
    deletedTasks,
    setDeletedTasks,
    deletedWeeklyOutputs,
    setDeletedWeeklyOutputs,
    deletedGoals,
    setDeletedGoals,
    marketplaceDeletedGoals,
    setMarketplaceDeletedGoals,
    isLoading,
    selectedDate,
    userId,
    loadAllData: loadAllDataForced,
    handleDateChange,
  };
};
