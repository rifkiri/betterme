
import React, { useState, useEffect } from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminDashboard } from "@/components/AdminDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/signin');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setCurrentUser(profile);
    } catch (error) {
      console.error('Error checking auth:', error);
      navigate('/signin');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Configure your app preferences and system settings</p>
        </div>

        {isAdmin ? (
          <AdminDashboard />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Access restricted</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">You don't have permission to access settings. Please contact your administrator.</p>
              <p className="text-sm text-gray-500 mt-2">Current role: {currentUser?.role}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Settings;
