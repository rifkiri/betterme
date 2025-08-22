
import React from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { SimpleEmployeeDashboard } from "@/components/SimpleEmployeeDashboard";
import { useAuthGuard } from "@/hooks/useAuthGuard";

const Index = () => {
  useAuthGuard();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <SimpleEmployeeDashboard />
    </div>
  );
};

export default Index;
