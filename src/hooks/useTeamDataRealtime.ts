
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TeamData } from '@/types/teamData';
import { teamDataService } from '@/services/TeamDataService';
import { toast } from 'sonner';

export const useTeamDataRealtime = () => {
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isInitialLoad = useRef(true);
  const subscriptionsRef = useRef<any[]>([]);

  const loadTeamData = async (showToast = false) => {
    if (!isInitialLoad.current && !showToast) {
      // For background updates, don't show loading state
    } else {
      setIsLoading(true);
    }
    
    setError(null);
    
    try {
      console.log('Loading team data...');
      const data = await teamDataService.getCurrentManagerTeamData();
      setTeamData(data);
      setLastUpdated(new Date());
      
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
    // Initial data load
    loadTeamData();
    
    // Set up real-time subscriptions
    setupRealtimeSubscriptions();
    
    // Cleanup on unmount
    return () => {
      subscriptionsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, []);

  return {
    teamData,
    isLoading,
    error,
    lastUpdated,
    manualRefresh
  };
};
