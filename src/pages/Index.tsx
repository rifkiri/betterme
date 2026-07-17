import React from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { SimpleEmployeeDashboard } from "@/components/SimpleEmployeeDashboard";
import { OverduePanelSection } from "@/components/OverduePanelSection";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <SimpleEmployeeDashboard />
      {user?.id && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <OverduePanelSection userId={user.id} />
        </div>
      )}
    </div>
  );
};

export default Index;
