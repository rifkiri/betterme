import { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { supabaseDataService } from '@/services/SupabaseDataService';

export interface MoodDataPoint {
  id?: string;
  userId?: string;
  date: string; // yyyy-MM-dd
  mood: number;
  notes?: string;
}

/**
 * Centralized mood data fetcher. Returns entries from the last 30 days
 * (inclusive) so every dashboard shows a consistent window.
 */
export const useMoodData = (userId?: string | null) => {
  const [moodData, setMoodData] = useState<MoodDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setMoodData([]);
      return;
    }
    setIsLoading(true);
    supabaseDataService
      .getMoodData(userId)
      .then((entries: any[]) => {
        if (cancelled) return;
        const cutoff = format(subDays(new Date(), 29), 'yyyy-MM-dd');
        const filtered = (entries || []).filter((e) => e.date >= cutoff);
        setMoodData(filtered);
      })
      .catch((err) => {
        console.error('useMoodData: failed to load mood data', err);
        if (!cancelled) setMoodData([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { moodData, isLoading };
};

/**
 * Filter a pre-fetched list of mood entries to the last 30 days.
 * Use for dashboards where mood data comes from a batched team query.
 */
export const filterMoodDataToLast30Days = <T extends { date: string }>(
  entries: T[] | undefined
): T[] => {
  if (!entries) return [];
  const cutoff = format(subDays(new Date(), 29), 'yyyy-MM-dd');
  return entries.filter((e) => e.date >= cutoff);
};
