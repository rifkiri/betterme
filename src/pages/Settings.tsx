
import React from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { Loader2 } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useProductivity } from "@/hooks/useProductivity";
import { useMoodTracking } from "@/hooks/useMoodTracking";
import { UserManagementSection } from "@/components/settings/UserManagementSection";
import { DataManagementSection } from "@/components/settings/DataManagementSection";
import { PreferencesSection } from "@/components/settings/PreferencesSection";

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
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your application preferences and data</p>
        </div>

        <div className="grid gap-6">
          <UserManagementSection userRole={profile?.role} />
          
          <DataManagementSection
            habits={habits}
            tasks={tasks}
            weeklyOutputs={weeklyOutputs}
            moodEntries={moodEntries}
            onRefreshData={handleRefreshData}
            userRole={profile?.role}
          />
          
          <PreferencesSection />
        </div>
      </div>
    </div>
  );
};

export default Settings;
