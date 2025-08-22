
import { googleOAuthService } from './GoogleOAuthService';
import { googleUsersService } from './GoogleUsersService';
import { googleHabitsService } from './GoogleHabitsService';
import { googleTasksService } from './GoogleTasksService';
import { googleWeeklyOutputsService } from './GoogleWeeklyOutputsService';
import { googleMoodTrackingService } from './GoogleMoodTrackingService';

class GoogleSheetsService {
  // API key configuration methods
  setCredentials(apiKey: string, spreadsheetId: string) {
    return googleOAuthService.setCredentials(apiKey, spreadsheetId);
  }

  isConfigured(): boolean {
    return googleOAuthService.isConfigured();
  }

  isAuthenticated(): boolean {
    return googleOAuthService.isAuthenticated();
  }

  clearConfig() {
    return googleOAuthService.clearConfig();
  }

  // User management methods
  async getUsers() {
    return googleUsersService.getUsers();
  }

  async addUser(user: any) {
    return googleUsersService.addUser(user);
  }

  async updateUser(userId: string, updates: any) {
    return googleUsersService.updateUser(userId, updates);
  }

  async deleteUser(userId: string) {
    return googleUsersService.deleteUser(userId);
  }

  // Habits methods
  async getHabits(userId: string) {
    return googleHabitsService.getHabits(userId);
  }

  async addHabit(habit: any) {
    return googleHabitsService.addHabit(habit);
  }

  async updateHabit(id: string, userId: string, updates: any) {
    return googleHabitsService.updateHabit(id, userId, updates);
  }

  // Tasks methods
  async getTasks(userId: string) {
    return googleTasksService.getTasks(userId);
  }

  async addTask(task: any) {
    return googleTasksService.addTask(task);
  }

  async updateTask(id: string, userId: string, updates: any) {
    return googleTasksService.updateTask(id, userId, updates);
  }

  // Weekly Outputs methods
  async getWeeklyOutputs(userId: string) {
    return googleWeeklyOutputsService.getWeeklyOutputs(userId);
  }

  async addWeeklyOutput(output: any) {
    return googleWeeklyOutputsService.addWeeklyOutput(output);
  }

  async updateWeeklyOutput(id: string, userId: string, updates: any) {
    return googleWeeklyOutputsService.updateWeeklyOutput(id, userId, updates);
  }

  // Mood Tracking methods
  async getMoodData(userId: string) {
    return googleMoodTrackingService.getMoodData(userId);
  }

  async addMoodEntry(moodEntry: any) {
    return googleMoodTrackingService.addMoodEntry(moodEntry);
  }

  async updateMoodEntry(id: string, userId: string, updates: any) {
    return googleMoodTrackingService.updateMoodEntry(id, userId, updates);
  }
}

export const googleSheetsService = new GoogleSheetsService();
