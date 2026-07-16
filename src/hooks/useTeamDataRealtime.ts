
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TeamData } from '@/types/teamData';
import { teamDataService } from '@/services/TeamDataService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Module-level cache so navigating away from /manager and back doesn't refetch
// from scratch. Realtime subscriptions keep this fresh in the background.
let cachedTeamData: TeamData | null = null;
let cachedForUserId: string | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;
const SS_CACHE_PREFIX = 'betterme_team_data_';

const readSessionCache = (userId: string): { data: TeamData; ts: number } | null => {
  try {
    const raw = sessionStorage.getItem(SS_CACHE_PREFIX + userId);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeSessionCache = (userId: string, data: TeamData) => {
  try {
    sessionStorage.setItem(SS_CACHE_PREFIX + userId, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // ignore quota errors
  }
};


export const useTeamDataRealtime = () => {
  const { user } = useAuth();
  const hasCache = !!user?.id && cachedForUserId === user.id && cachedTeamData !== null;
  const [teamData, setTeamData] = useState<TeamData | null>(hasCache ? cachedTeamData : null);
  const [isLoading, setIsLoading] = useState(!hasCache);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(hasCache ? new Date(cachedAt) : null);
  const isInitialLoad = useRef(!hasCache);
  const subscriptionsRef = useRef<any[]>([]);

  const loadTeamData = async (showToast = false) => {
    if (!user?.id) {
      setError('No user authenticated');
      setIsLoading(false);
      return;
    }
    
    if (!isInitialLoad.current && !showToast) {
      // For background updates, don't show loading state
    } else {
      setIsLoading(true);
    }
    
    setError(null);
    
    try {
      console.log('Loading team data...');
      const data = await teamDataService.getCurrentManagerTeamData({ userId: user.id });
      setTeamData(data);
      cachedTeamData = data;
      cachedForUserId = user.id;
      cachedAt = Date.now();
      setLastUpdated(new Date(cachedAt));
      
      if (showToast && !isInitialLoad.current) {
        toast.success('Team data updated');
      }
      
      console.log('Team data loaded successfully:', data);
    } catch (error) {
      console.error('Failed to load team data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load team data');
      
      if (isInitialLoad.current) {
        toast.error('Failed to load team data. Please try again.');
      }
    } finally {
      setIsLoading(false);
      isInitialLoad.current = false;
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Clean up existing subscriptions
    subscriptionsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    subscriptionsRef.current = [];

    // Subscribe to changes in relevant tables
    const tables = ['profiles', 'habits', 'tasks', 'weekly_outputs', 'mood_entries', 'goals', 'goal_assignments', 'goal_notifications'];
    
    tables.forEach(tableName => {
      const channel = supabase
        .channel(`team-data-${tableName}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: tableName
          },
          (payload) => {
            console.log(`Real-time update received for ${tableName}:`, payload);
            // Debounce the data reload to avoid too many rapid updates
            setTimeout(() => loadTeamData(false), 1000);
          }
        )
        .subscribe();
      
      subscriptionsRef.current.push(channel);
    });

    console.log('Real-time subscriptions set up for team data');
  };

  const manualRefresh = () => {
    loadTeamData(true);
  };

  useEffect(() => {
    if (!user?.id) return;

    const cacheFresh =
      cachedForUserId === user.id &&
      cachedTeamData !== null &&
      Date.now() - cachedAt < CACHE_TTL_MS;

    if (cacheFresh) {
      // Hydrate from cache; realtime will keep it fresh.
      setTeamData(cachedTeamData);
      setIsLoading(false);
      isInitialLoad.current = false;
    } else {
      loadTeamData();
    }

    setupRealtimeSubscriptions();

    return () => {
      subscriptionsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user?.id]);

  return {
    teamData,
    isLoading,
    error,
    lastUpdated,
    manualRefresh
  };
};
