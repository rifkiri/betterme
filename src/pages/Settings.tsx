
import React from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { Loader2, Users, Database, Settings as SettingsIcon } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useProductivity } from "@/hooks/useProductivity";
import { useMoodTracking } from "@/hooks/useMoodTracking";
import { UserManagementSection } from "@/components/settings/UserManagementSection";
import { DataManagementSection } from "@/components/settings/DataManagementSection";
import { PreferencesSection } from "@/components/settings/PreferencesSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Settings = () => {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const { habits, tasks, weeklyOutputs, loadAllData } = useProductivity();
  const { moodEntries, loadMoodData } = useMoodTracking();

  const handleRefreshData = async () => {
    await Promise.all([loadAllData(), loadMoodData()]);
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
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 text-sm sm:text-base">Manage your application preferences and data</p>
        </div>

        <Tabs defaultValue={profile?.role === 'admin' ? 'users' : 'data'} className="w-full">
          <TabsList className="grid w-full h-auto p-1 bg-gray-100 rounded-lg">
            {profile?.role === 'admin' && (
              <TabsTrigger 
                value="users" 
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">User Management</span>
                <span className="sm:hidden">Users</span>
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="data" 
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Database className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Data Management</span>
              <span className="sm:hidden">Data</span>
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <SettingsIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Preferences</span>
              <span className="sm:hidden">Prefs</span>
            </TabsTrigger>
          </TabsList>

          {profile?.role === 'admin' && (
            <TabsContent value="users" className="mt-4 sm:mt-6">
              <UserManagementSection userRole={profile?.role} />
            </TabsContent>
          )}

          <TabsContent value="data" className="mt-4 sm:mt-6">
            <DataManagementSection
              habits={habits}
              tasks={tasks}
              weeklyOutputs={weeklyOutputs}
              moodEntries={moodEntries}
              onRefreshData={handleRefreshData}
              userRole={profile?.role}
            />
          </TabsContent>

          <TabsContent value="preferences" className="mt-4 sm:mt-6">
            <PreferencesSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
