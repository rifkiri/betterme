
import React from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { TeamDashboard } from "@/components/TeamDashboard";
import { useAuthGuard } from "@/hooks/useAuthGuard";

const TeamPage = () => {
  useAuthGuard();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <AppNavigation />
      <TeamDashboard />
    </div>
  );
};

export default TeamPage;
