import { supabaseProfilesService } from './SupabaseProfilesService';
import { supabaseHabitsService } from './SupabaseHabitsService';
import { supabaseTasksService } from './SupabaseTasksService';
import { supabaseWeeklyOutputsService } from './SupabaseWeeklyOutputsService';
import { supabaseMoodService } from './SupabaseMoodService';
import { supabaseGoalsService } from './SupabaseGoalsService';

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

  async activateUser(userId: string) {
    return await supabaseProfilesService.activateUser(userId);
  }

  // Habits management
  async getHabits(userId: string) {
    return await supabaseHabitsService.getHabits(userId);
  }

  async getHabitsForDate(userId: string, date: Date) {
    return await supabaseHabitsService.getHabitsForDate(userId, date);
  }

  async addHabit(habit: any) {
    return await supabaseHabitsService.addHabit(habit);
  }

  async updateHabit(id: string, userId: string, updates: any) {
    return await supabaseHabitsService.updateHabit(id, userId, updates);
  }

  async toggleHabitForDate(habitId: string, userId: string, date: Date, completed: boolean) {
    return await supabaseHabitsService.toggleHabitForDate(habitId, userId, date, completed);
  }

  async permanentlyDeleteHabit(id: string, userId: string) {
    return await supabaseHabitsService.permanentlyDeleteHabit(id, userId);
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

  async permanentlyDeleteTask(id: string, userId: string) {
    return await supabaseTasksService.permanentlyDeleteTask(id, userId);
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

  async permanentlyDeleteWeeklyOutput(id: string, userId: string) {
    return await supabaseWeeklyOutputsService.permanentlyDeleteWeeklyOutput(id, userId);
  }

  // Goals management
  async getGoals(userId: string) {
    return await supabaseGoalsService.getUserAccessibleGoals(userId);
  }

  async getAllGoals() {
    return await supabaseGoalsService.getAllGoals();
  }

  async addGoal(goal: any) {
    return await supabaseGoalsService.addGoal(goal);
  }

  async updateGoal(id: string, userId: string, updates: any) {
    return await supabaseGoalsService.updateGoal(id, userId, updates);
  }

  async updateGoalProgress(id: string, userId: string, currentValue: number) {
    return await supabaseGoalsService.updateGoalProgress(id, userId, currentValue);
  }

  async permanentlyDeleteGoal(id: string, userId: string) {
    return await supabaseGoalsService.permanentlyDeleteGoal(id, userId);
  }

  // Goal-output linkages handled directly through weekly_outputs.linked_goal_id column

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
