
import React from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { MonthlyDashboard } from "@/components/MonthlyDashboard";
import { useAuthGuard } from "@/hooks/useAuthGuard";

const Monthly = () => {
  useAuthGuard();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <MonthlyDashboard />
    </div>
  );
};

export default Monthly;
