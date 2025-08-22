
import React from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { MonthlyDashboard } from "@/components/MonthlyDashboard";

const Monthly = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <MonthlyDashboard />
    </div>
  );
};

export default Monthly;
