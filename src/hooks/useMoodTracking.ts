
import { useState, useEffect } from 'react';
import { googleSheetsService } from '@/services/GoogleSheetsService';
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

  // Load mood data from Google Sheets
  const loadMoodData = async () => {
    if (!userId || !googleSheetsService.isConfigured() || !googleSheetsService.isAuthenticated()) {
      return;
    }

    setIsLoading(true);
    try {
      const moodData = await googleSheetsService.getMoodData(userId);
      setMoodEntries(moodData);
    } catch (error) {
      console.error('Failed to load mood data from Google Sheets:', error);
      toast.error('Failed to load mood data from Google Sheets');
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

    if (googleSheetsService.isConfigured() && googleSheetsService.isAuthenticated()) {
      try {
        await googleSheetsService.addMoodEntry(newEntry);
        await loadMoodData();
        toast.success('Mood entry saved to Google Sheets');
      } catch (error) {
        toast.error('Failed to save mood entry to Google Sheets');
        // Fallback to local state
        setMoodEntries(prev => [...prev, newEntry]);
      }
    } else {
      // Store locally if not authenticated
      setMoodEntries(prev => [...prev, newEntry]);
      toast.info('Mood entry saved locally. Connect to Google Sheets to sync.');
    }
  };

  // Update existing mood entry
  const updateMoodEntry = async (id: string, mood: number, notes?: string) => {
    if (!userId) return;

    if (googleSheetsService.isConfigured() && googleSheetsService.isAuthenticated()) {
      try {
        await googleSheetsService.updateMoodEntry(id, userId, { mood, notes });
        await loadMoodData();
        toast.success('Mood entry updated in Google Sheets');
      } catch (error) {
        toast.error('Failed to update mood entry in Google Sheets');
        // Fallback to local state
        setMoodEntries(prev => prev.map(entry => 
          entry.id === id ? { ...entry, mood, notes } : entry
        ));
      }
    } else {
      // Update locally if not authenticated
      setMoodEntries(prev => prev.map(entry => 
        entry.id === id ? { ...entry, mood, notes } : entry
      ));
      toast.info('Mood entry updated locally. Connect to Google Sheets to sync.');
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
