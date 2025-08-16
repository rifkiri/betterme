
import React from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { TeamDashboard } from "@/components/TeamDashboard";

const TeamPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <TeamDashboard />
    </div>
  );
};

export default TeamPage;
