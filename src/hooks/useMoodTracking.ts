
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

  // Check if Google Sheets is available
  const isGoogleSheetsAvailable = () => {
    return googleSheetsService.isConfigured() && googleSheetsService.isAuthenticated();
  };

  // Load mood data from Google Sheets
  const loadMoodData = async () => {
    if (!userId) {
      return;
    }

    setIsLoading(true);
    try {
      if (isGoogleSheetsAvailable()) {
        console.log('Loading mood data from Google Sheets...');
        const moodData = await googleSheetsService.getMoodData(userId);
        setMoodEntries(moodData);
        console.log('Mood data loaded from Google Sheets successfully');
      } else {
        console.log('Google Sheets not available for mood data');
        toast.error('Google Sheets not configured for mood tracking');
      }
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

    try {
      if (isGoogleSheetsAvailable()) {
        await googleSheetsService.addMoodEntry(newEntry);
        await loadMoodData();
        toast.success('Mood entry saved successfully');
      } else {
        toast.error('Google Sheets not available');
      }
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
      if (isGoogleSheetsAvailable()) {
        await googleSheetsService.updateMoodEntry(id, userId, { mood, notes });
        await loadMoodData();
        toast.success('Mood entry updated successfully');
      } else {
        toast.error('Google Sheets not available');
      }
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
