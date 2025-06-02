
import { supabase } from '@/integrations/supabase/client';

interface MoodEntry {
  id: string;
  userId: string;
  date: string;
  mood: number;
  notes?: string;
}

export class SupabaseMoodService {
  async getMoodData(userId: string): Promise<MoodEntry[]> {
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching mood data:', error);
      throw error;
    }

    return data.map(entry => ({
      id: entry.id,
      userId: entry.user_id,
      date: entry.date,
      mood: entry.mood,
      notes: entry.notes
    }));
  }

  async addMoodEntry(moodEntry: MoodEntry): Promise<void> {
    // First check if an entry already exists for this user and date
    const { data: existingEntry } = await supabase
      .from('mood_entries')
      .select('id')
      .eq('user_id', moodEntry.userId)
      .eq('date', moodEntry.date)
      .single();

    if (existingEntry) {
      // Update existing entry
      const { error } = await supabase
        .from('mood_entries')
        .update({
          mood: moodEntry.mood,
          notes: moodEntry.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingEntry.id);

      if (error) {
        console.error('Error updating mood entry:', error);
        throw error;
      }
    } else {
      // Insert new entry
      const { error } = await supabase
        .from('mood_entries')
        .insert({
          id: moodEntry.id,
          user_id: moodEntry.userId,
          date: moodEntry.date,
          mood: moodEntry.mood,
          notes: moodEntry.notes
        });

      if (error) {
        console.error('Error adding mood entry:', error);
        throw error;
      }
    }
  }

  async updateMoodEntry(id: string, userId: string, updates: Partial<MoodEntry>): Promise<void> {
    const supabaseUpdates: any = {};
    
    if (updates.mood !== undefined) supabaseUpdates.mood = updates.mood;
    if (updates.notes !== undefined) supabaseUpdates.notes = updates.notes;
    supabaseUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('mood_entries')
      .update(supabaseUpdates)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating mood entry:', error);
      throw error;
    }
  }
}

export const supabaseMoodService = new SupabaseMoodService();
