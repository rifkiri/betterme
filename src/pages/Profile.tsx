
import React from "react";
import { AppNavigation } from "@/components/AppNavigation";

const Profile = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Profile</h1>
          <p className="text-gray-600 mb-8">Manage your account and preferences</p>
          <div className="bg-white rounded-lg shadow p-8">
            <p className="text-gray-500">Profile settings coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
