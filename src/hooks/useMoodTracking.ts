
import { useState, useEffect } from 'react';
import { localDataService } from '@/services/LocalDataService';
import { toast } from 'sonner';

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

  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    const authUser = localStorage.getItem('authUser');
    return authUser ? JSON.parse(authUser).id : null;
  };

  const userId = getCurrentUserId();

  // Load mood data from local storage
  const loadMoodData = async () => {
    if (!userId) {
      return;
    }

    setIsLoading(true);
    try {
      const moodData = localDataService.getMoodData(userId);
      setMoodEntries(moodData);
    } catch (error) {
      console.error('Failed to load mood data:', error);
      toast.error('Failed to load mood data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMoodData();
  }, [userId]);

  // Add new mood entry
  const addMoodEntry = async (date: string, mood: number, notes?: string) => {
    if (!userId) return;

    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      userId,
      date,
      mood,
      notes
    };

    try {
      localDataService.addMoodEntry(newEntry);
      await loadMoodData();
      toast.success('Mood entry saved successfully');
    } catch (error) {
      toast.error('Failed to save mood entry');
      // Fallback to local state
      setMoodEntries(prev => [...prev, newEntry]);
    }
  };

  // Update existing mood entry
  const updateMoodEntry = async (id: string, mood: number, notes?: string) => {
    if (!userId) return;

    try {
      localDataService.updateMoodEntry(id, userId, { mood, notes });
      await loadMoodData();
      toast.success('Mood entry updated successfully');
    } catch (error) {
      toast.error('Failed to update mood entry');
      // Fallback to local state
      setMoodEntries(prev => prev.map(entry => 
        entry.id === id ? { ...entry, mood, notes } : entry
      ));
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
