import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  userId: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({
    user,
    userId: user?.id || null,
    isAuthenticated: !!user,
  }),

  setLoading: (isLoading) => set({ isLoading }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      userId: null,
      isAuthenticated: false,
    });
  },

  initialize: async () => {
    set({ isLoading: true });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      get().setUser(user);
    } catch (error) {
      console.error('Auth initialization error:', error);
      get().setUser(null);
    } finally {
      set({ isLoading: false });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      get().setUser(session?.user || null);
    });
  },
}));