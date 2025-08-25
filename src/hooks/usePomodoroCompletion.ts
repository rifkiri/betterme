import { useCallback } from 'react';
import { SupabasePomodoroService } from '@/services/SupabasePomodoroService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';

export const usePomodoroCompletion = () => {
  const { currentUser } = useCurrentUser();

  const saveCompletedSession = useCallback(async (
    taskId: string | null,
    duration: number,
    sessionType: 'work' | 'short_break' | 'long_break',
    interrupted: boolean = false
  ) => {
    if (!currentUser?.id) return;

    try {
      await SupabasePomodoroService.saveSession({
        user_id: currentUser.id,
        task_id: taskId || undefined,
        duration_minutes: duration,
        session_type: sessionType,
        interrupted,
      });
      
      if (!interrupted && sessionType === 'work') {
        toast.success('Pomodoro session saved!');
      }
    } catch (error) {
      console.error('Error saving pomodoro session:', error);
    }
  }, [currentUser]);

  return { saveCompletedSession };
};