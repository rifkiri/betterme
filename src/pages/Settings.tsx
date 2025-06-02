
import React, { useState } from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  Database, 
  Moon, 
  Sun, 
  Bell, 
  Shield,
  Download,
  Trash2,
  Loader2,
  Mail
} from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useProductivity } from "@/hooks/useProductivity";
import { useMoodTracking } from "@/hooks/useMoodTracking";
import { toast } from "sonner";

const Settings = () => {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const { habits, tasks, weeklyOutputs, loadAllData } = useProductivity();
  const { moodEntries, loadMoodData } = useMoodTracking();
  
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [emailReminders, setEmailReminders] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadAllData(),
        loadMoodData()
      ]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportData = () => {
    const data = {
      habits,
      tasks,
      weeklyOutputs,
      moodEntries,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `productivity-data-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Data exported successfully');
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNavigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your application preferences and data</p>
        </div>

        <div className="grid gap-6">
          {/* User Information */}
          {profile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account Overview
                </CardTitle>
                <CardDescription>
                  Current user information and role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{profile.name}</p>
                    <p className="text-sm text-gray-600">{profile.email}</p>
                    {profile.position && (
                      <p className="text-sm text-gray-600">{profile.position}</p>
                    )}
                  </div>
                  <Badge className={`
                    ${profile.role === 'admin' ? 'bg-red-100 text-red-800' : 
                      profile.role === 'manager' ? 'bg-blue-100 text-blue-800' : 
                      'bg-green-100 text-green-800'}
                  `}>
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Manage your productivity and mood tracking data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{habits.length}</p>
                  <p className="text-xs text-gray-600">Habits</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{tasks.length}</p>
                  <p className="text-xs text-gray-600">Tasks</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{weeklyOutputs.length}</p>
                  <p className="text-xs text-gray-600">Outputs</p>
                </div>
                <div className="text-center p-3 bg-pink-50 rounded-lg">
                  <p className="text-2xl font-bold text-pink-600">{moodEntries.length}</p>
                  <p className="text-xs text-gray-600">Mood Entries</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleRefreshData} 
                  variant="outline" 
                  disabled={isRefreshing}
                  className="flex-1"
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  Refresh Data
                </Button>
                
                <Button 
                  onClick={handleExportData} 
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Preferences
              </CardTitle>
              <CardDescription>
                Customize your application experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label htmlFor="notifications">Push Notifications</Label>
                    <p className="text-sm text-gray-600">Receive notifications for important updates</p>
                  </div>
                </div>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label htmlFor="email-reminders">Email Reminders</Label>
                    <p className="text-sm text-gray-600">Get email reminders for deadlines and tasks</p>
                  </div>
                </div>
                <Switch
                  id="email-reminders"
                  checked={emailReminders}
                  onCheckedChange={setEmailReminders}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? (
                    <Moon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Sun className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-gray-600">Toggle dark/light theme</p>
                  </div>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          {profile?.role === 'admin' && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions - use with caution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="w-full">
                  Reset All Data
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
