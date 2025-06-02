
import { useState, useEffect } from 'react';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MoodEntry {
  id: string;
  userId: string;
  date: string;
  mood: number;
  notes?: string;
}

export const useMoodTracking = () => {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get current user ID from Supabase auth
  const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  };

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const initializeUser = async () => {
      const currentUserId = await getCurrentUserId();
      setUserId(currentUserId);
    };
    initializeUser();
  }, []);

  // Check if Supabase is available
  const isSupabaseAvailable = () => {
    return supabaseDataService.isConfigured() && userId !== null;
  };

  // Load mood data from Supabase
  const loadMoodData = async () => {
    if (!userId) {
      return;
    }

    setIsLoading(true);
    try {
      if (isSupabaseAvailable()) {
        console.log('Loading mood data from Supabase...');
        const moodData = await supabaseDataService.getMoodData(userId);
        setMoodEntries(moodData);
        console.log('Mood data loaded from Supabase successfully');
      } else {
        console.log('Supabase not available for mood data');
        toast.error('Please sign in to access mood tracking');
      }
    } catch (error) {
      console.error('Failed to load mood data from Supabase:', error);
      toast.error('Failed to load mood data from Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadMoodData();
    }
  }, [userId]);

  // Add new mood entry
  const addMoodEntry = async (date: string, mood: number, notes?: string) => {
    if (!userId) return;

    const newEntry: MoodEntry = {
      id: crypto.randomUUID(),
      userId,
      date,
      mood,
      notes
    };

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.addMoodEntry(newEntry);
        await loadMoodData();
        toast.success('Mood entry saved successfully');
      } else {
        toast.error('Please sign in to save mood entries');
      }
    } catch (error) {
      toast.error('Failed to save mood entry');
      console.error('Failed to save mood entry:', error);
    }
  };

  // Update existing mood entry
  const updateMoodEntry = async (id: string, mood: number, notes?: string) => {
    if (!userId) return;

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateMoodEntry(id, userId, { mood, notes });
        await loadMoodData();
        toast.success('Mood entry updated successfully');
      } else {
        toast.error('Please sign in to update mood entries');
      }
    } catch (error) {
      toast.error('Failed to update mood entry');
      console.error('Failed to update mood entry:', error);
    }
  };

  // Get mood entry for specific date
  const getMoodForDate = (date: string) => {
    return moodEntries.find(entry => entry.date === date);
  };

  // Get mood entries for date range
  const getMoodEntriesForDateRange = (startDate: string, endDate: string) => {
    return moodEntries.filter(entry => 
      entry.date >= startDate && entry.date <= endDate
    );
  };

  return {
    moodEntries,
    isLoading,
    addMoodEntry,
    updateMoodEntry,
    getMoodForDate,
    getMoodEntriesForDateRange,
    loadMoodData
  };
};
