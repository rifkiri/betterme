
import React from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { TeamDashboard } from "@/components/TeamDashboard";

const TeamPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <AppNavigation />
      <TeamDashboard />
    </div>
  );
};

export default TeamPage;
