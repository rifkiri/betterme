
import React from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { ManagerDashboard } from "@/components/ManagerDashboard";

const Manager = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <ManagerDashboard />
    </div>
  );
};

export default Manager;
