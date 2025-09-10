import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ActivePomodoroSession } from '@/services/SupabaseActivePomodoroService';

// Global state management for Pomodoro sessions
class PomodoroGlobalState {
  private static instance: PomodoroGlobalState;
  private listeners: Set<(session: ActivePomodoroSession | null) => void> = new Set();
  private currentSession: ActivePomodoroSession | null = null;
  private storageKey = 'pomodoro-global-session';
  private realtimeChannel: any = null;

  static getInstance(): PomodoroGlobalState {
    if (!PomodoroGlobalState.instance) {
      PomodoroGlobalState.instance = new PomodoroGlobalState();
    }
    return PomodoroGlobalState.instance;
  }

  constructor() {
    this.initStorageSync();
    this.initRealtimeSubscription();
  }

  private initStorageSync() {
    // Listen for storage changes from other hook instances
    window.addEventListener('storage', (e) => {
      if (e.key === this.storageKey) {
        const session = e.newValue ? JSON.parse(e.newValue) : null;
        this.updateSession(session, false); // Don't broadcast to avoid infinite loop
      }
    });

    // Listen for custom events for same-tab communication
    window.addEventListener('pomodoro-state-change', (e: any) => {
      this.updateSession(e.detail.session, false);
    });
  }

  private initRealtimeSubscription() {
    // Subscribe to real-time changes in active_pomodoro_sessions table
    this.realtimeChannel = supabase
      .channel('pomodoro-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_pomodoro_sessions'
        },
        (payload) => {
          console.log('Real-time pomodoro session change:', payload);
          
          if (payload.eventType === 'DELETE') {
            // Session was terminated
            this.updateSession(null, false);
          } else if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            // Session was updated - refresh current session if it matches
            const updatedSession = payload.new as ActivePomodoroSession;
            if (this.currentSession?.id === updatedSession.id) {
              this.updateSession(updatedSession, false);
            }
          }
        }
      )
      .subscribe();
  }

  subscribe(callback: (session: ActivePomodoroSession | null) => void): () => void {
    this.listeners.add(callback);
    // Immediately call with current state
    callback(this.currentSession);

    return () => {
      this.listeners.delete(callback);
    };
  }

  updateSession(session: ActivePomodoroSession | null, broadcast: boolean = true) {
    this.currentSession = session;

    if (broadcast) {
      // Update sessionStorage for cross-tab sync
      if (session) {
        sessionStorage.setItem(this.storageKey, JSON.stringify(session));
      } else {
        sessionStorage.removeItem(this.storageKey);
      }

      // Dispatch custom event for same-tab communication
      window.dispatchEvent(new CustomEvent('pomodoro-state-change', {
        detail: { session }
      }));
    }

    // Notify all listeners
    this.listeners.forEach(callback => callback(session));
  }

  getCurrentSession(): ActivePomodoroSession | null {
    return this.currentSession;
  }

  // Force termination from any hook instance
  terminateCurrentSession() {
    this.updateSession(null, true);
  }

  cleanup() {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
    }
  }
}

// Hook to use global Pomodoro state
export const usePomodoroGlobalState = () => {
  const [globalSession, setGlobalSession] = useState<ActivePomodoroSession | null>(null);
  const [updateCounter, setUpdateCounter] = useState(0);

  useEffect(() => {
    const globalState = PomodoroGlobalState.getInstance();
    
    // Subscribe to global state changes
    const unsubscribe = globalState.subscribe((session) => {
      setGlobalSession(session);
      setUpdateCounter(prev => prev + 1); // Force re-render
    });

    // Initialize with current session from storage if available
    const storedSession = sessionStorage.getItem('pomodoro-global-session');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        globalState.updateSession(session, false);
      } catch (error) {
        console.error('Error parsing stored session:', error);
      }
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const updateGlobalSession = useCallback((session: ActivePomodoroSession | null) => {
    const globalState = PomodoroGlobalState.getInstance();
    globalState.updateSession(session, true);
  }, []);

  const terminateGlobalSession = useCallback(() => {
    const globalState = PomodoroGlobalState.getInstance();
    globalState.terminateCurrentSession();
  }, []);

  return {
    globalSession,
    updateGlobalSession,
    terminateGlobalSession,
    updateCounter, // Can be used to force re-renders if needed
  };
};

// Cleanup function for app-level cleanup
export const cleanupPomodoroGlobalState = () => {
  const instance = PomodoroGlobalState.getInstance();
  instance.cleanup();
};