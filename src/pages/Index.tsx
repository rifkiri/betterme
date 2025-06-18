
import React from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { SimpleEmployeeDashboard } from "@/components/SimpleEmployeeDashboard";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <SimpleEmployeeDashboard />
    </div>
  );
};

export default Index;
