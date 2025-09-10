import { ActivePomodoroSession } from '@/services/SupabaseActivePomodoroService';

/**
 * Determines the appropriate start action based on the current session state
 * @param activeSession - The current active session (if any)
 * @param isRunning - Whether the timer is currently running
 * @param actions - Object containing all possible actions
 * @returns The appropriate function to call when start button is clicked
 */
export const getSessionStartAction = (
  activeSession: ActivePomodoroSession | null,
  isRunning: boolean,
  actions: {
    startWork: () => void;
    startBreak: (type: 'short_break' | 'long_break') => void;
    resumeWork: () => void;
    togglePause: () => void;
  }
) => {
  // If currently running, pause/resume
  if (isRunning) {
    return actions.togglePause;
  }
  
  // If session is paused, resume work
  if (activeSession?.session_status === 'active-paused') {
    return actions.resumeWork;
  }
  
  // If session is stopped, determine what to start based on session type
  if (activeSession?.session_status === 'active-stopped') {
    switch (activeSession.current_session_type) {
      case 'work':
        return actions.startWork;
      case 'short_break':
        return () => actions.startBreak('short_break');
      case 'long_break':
        return () => actions.startBreak('long_break');
      default:
        return actions.startWork; // Fallback to work session
    }
  }
  
  // Default fallback - start work session
  return actions.startWork;
};

/**
 * Gets the appropriate tooltip text for the start button
 * @param activeSession - The current active session (if any)
 * @param isRunning - Whether the timer is currently running
 * @returns Tooltip text for the start button
 */
export const getStartButtonTooltip = (
  activeSession: ActivePomodoroSession | null,
  isRunning: boolean
): string => {
  if (isRunning) {
    return 'Pause';
  }
  
  if (activeSession?.session_status === 'active-paused') {
    return 'Resume';
  }
  
  if (activeSession?.session_status === 'active-stopped') {
    switch (activeSession.current_session_type) {
      case 'work':
        return 'Start Work';
      case 'short_break':
        return 'Start Short Break';
      case 'long_break':
        return 'Start Long Break';
      default:
        return 'Start';
    }
  }
  
  return 'Start';
};