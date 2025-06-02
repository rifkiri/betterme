
import { supabaseProfilesService } from './SupabaseProfilesService';
import { supabaseHabitsService } from './SupabaseHabitsService';
import { supabaseTasksService } from './SupabaseTasksService';
import { supabaseWeeklyOutputsService } from './SupabaseWeeklyOutputsService';
import { supabaseMoodService } from './SupabaseMoodService';

export class SupabaseDataService {
  // User management
  async getUsers() {
    return await supabaseProfilesService.getUsers();
  }

  async addUser(user: any) {
    return await supabaseProfilesService.addUser(user);
  }

  async updateUser(userId: string, updates: any) {
    return await supabaseProfilesService.updateUser(userId, updates);
  }

  async deleteUser(userId: string) {
    return await supabaseProfilesService.deleteUser(userId);
  }

  // Habits management
  async getHabits(userId: string) {
    return await supabaseHabitsService.getHabits(userId);
  }

  async addHabit(habit: any) {
    return await supabaseHabitsService.addHabit(habit);
  }

  async updateHabit(id: string, userId: string, updates: any) {
    return await supabaseHabitsService.updateHabit(id, userId, updates);
  }

  // Tasks management
  async getTasks(userId: string) {
    return await supabaseTasksService.getTasks(userId);
  }

  async addTask(task: any) {
    return await supabaseTasksService.addTask(task);
  }

  async updateTask(id: string, userId: string, updates: any) {
    return await supabaseTasksService.updateTask(id, userId, updates);
  }

  // Weekly outputs management
  async getWeeklyOutputs(userId: string) {
    return await supabaseWeeklyOutputsService.getWeeklyOutputs(userId);
  }

  async addWeeklyOutput(output: any) {
    return await supabaseWeeklyOutputsService.addWeeklyOutput(output);
  }

  async updateWeeklyOutput(id: string, userId: string, updates: any) {
    return await supabaseWeeklyOutputsService.updateWeeklyOutput(id, userId, updates);
  }

  // Mood tracking
  async getMoodData(userId: string) {
    return await supabaseMoodService.getMoodData(userId);
  }

  async addMoodEntry(moodEntry: any) {
    return await supabaseMoodService.addMoodEntry(moodEntry);
  }

  async updateMoodEntry(id: string, userId: string, updates: any) {
    return await supabaseMoodService.updateMoodEntry(id, userId, updates);
  }

  // Utility methods
  isConfigured() {
    return true; // Supabase is always configured if the client is imported
  }

  isAuthenticated() {
    return true; // We'll handle authentication through Supabase auth
  }
}

export const supabaseDataService = new SupabaseDataService();
