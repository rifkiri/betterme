
import { useState, useEffect } from 'react';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface MoodEntry {
  id: string;
  userId: string;
  date: string;
  mood: number;
  notes?: string;
}

export const useMoodTracking = () => {
  const { user } = useAuth();
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check if Supabase is available
  const isSupabaseAvailable = () => {
    return supabaseDataService.isConfigured() && user?.id !== null;
  };

  // Load mood data from Supabase
  const loadMoodData = async () => {
    if (!user?.id) {
      return;
    }

    setIsLoading(true);
    try {
      if (isSupabaseAvailable()) {
        console.log('Loading mood data from Supabase...');
        const moodData = await supabaseDataService.getMoodData(user.id);
        setMoodEntries(moodData);
        console.log('Mood data loaded from Supabase successfully');
      } else {
        console.log('Supabase not available for mood data');
        toast.error('Please sign in to access mood tracking');
      }
    } catch (error) {
      console.error('Failed to load mood data from Supabase:', error);
      toast.error('Failed to load mood data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadMoodData();
    } else {
      setMoodEntries([]);
    }
  }, [user?.id]);

  // Add or update mood entry
  const addMoodEntry = async (date: string, mood: number, notes?: string) => {
    if (!user?.id) {
      toast.error('Please sign in to save mood entries');
      return;
    }

    const newEntry: MoodEntry = {
      id: crypto.randomUUID(),
      userId: user.id,
      date,
      mood,
      notes
    };

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.addMoodEntry(newEntry);
        await loadMoodData(); // Reload data to get the latest
        
        // Check if this was an update (entry already existed for today)
        const existingEntryForToday = moodEntries.find(entry => entry.date === date);
        if (existingEntryForToday) {
          toast.success('Mood entry updated successfully');
        } else {
          toast.success('Mood entry saved successfully');
        }
      } else {
        toast.error('Please sign in to save mood entries');
      }
    } catch (error) {
      console.error('Failed to save mood entry:', error);
      toast.error('Failed to save mood entry. Please try again.');
    }
  };

  // Update existing mood entry
  const updateMoodEntry = async (id: string, mood: number, notes?: string) => {
    if (!user?.id) return;

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateMoodEntry(id, user.id, { mood, notes });
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
