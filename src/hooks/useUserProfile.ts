
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'team-member';
  position?: string;
  hasChangedPassword: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user ID from Supabase auth
  const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  };

  useEffect(() => {
    const initializeUser = async () => {
      const currentUserId = await getCurrentUserId();
      setUserId(currentUserId);
    };
    initializeUser();
  }, []);

  // Load user profile from Supabase
  const loadProfile = async () => {
    if (!userId) {
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
        return;
      }

      if (data) {
        setProfile({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          position: data.position,
          hasChangedPassword: data.has_changed_password,
          lastLogin: data.last_login,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userId) {
      toast.error('Please sign in to update profile');
      return;
    }

    try {
      const supabaseUpdates: any = {};
      
      if (updates.name) supabaseUpdates.name = updates.name;
      if (updates.email) supabaseUpdates.email = updates.email;
      if (updates.position !== undefined) supabaseUpdates.position = updates.position;
      if (updates.hasChangedPassword !== undefined) supabaseUpdates.has_changed_password = updates.hasChangedPassword;

      const { error } = await supabase
        .from('profiles')
        .update(supabaseUpdates)
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile');
        return;
      }

      await loadProfile(); // Reload profile data
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    }
  };

  // Sign out user
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        toast.error('Failed to sign out');
        return;
      }
      
      setProfile(null);
      setUserId(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Failed to sign out:', error);
      toast.error('Failed to sign out');
    }
  };

  return {
    profile,
    isLoading,
    updateProfile,
    signOut,
    loadProfile
  };
};
