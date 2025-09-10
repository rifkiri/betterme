import { useState, useEffect } from 'react';
import { ActivePomodoroSession } from '@/services/SupabaseActivePomodoroService';

/**
 * Hook to detect if the active session's task is currently visible on the page
 */
export const useActiveTaskVisibility = (activeSession: ActivePomodoroSession | null) => {
  const [isActiveTaskVisible, setIsActiveTaskVisible] = useState(false);

  useEffect(() => {
    if (!activeSession?.task_id) {
      setIsActiveTaskVisible(false);
      return;
    }

    const checkTaskVisibility = () => {
      // Look for task elements that might contain the active task
      const taskElements = document.querySelectorAll('[data-task-id], [data-testid*="task"]');
      let taskFound = false;

      taskElements.forEach(element => {
        const taskId = element.getAttribute('data-task-id');
        if (taskId === activeSession.task_id) {
          // Check if this specific task element is visible
          const rect = element.getBoundingClientRect();
          const isInViewport = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
          );
          
          if (isInViewport) {
            taskFound = true;
          }
        }
      });

      setIsActiveTaskVisible(taskFound);
    };

    // Initial check
    checkTaskVisibility();

    // Set up observers for changes
    const handleScroll = () => checkTaskVisibility();
    const handleResize = () => checkTaskVisibility();
    
    // Debounce for performance
    let scrollTimer: NodeJS.Timeout;
    const debouncedCheck = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(checkTaskVisibility, 100);
    };

    window.addEventListener('scroll', debouncedCheck);
    window.addEventListener('resize', debouncedCheck);

    // Observer for DOM changes (tasks being added/removed)
    const observer = new MutationObserver(debouncedCheck);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['data-task-id']
    });

    return () => {
      window.removeEventListener('scroll', debouncedCheck);
      window.removeEventListener('resize', debouncedCheck);
      observer.disconnect();
      clearTimeout(scrollTimer);
    };
  }, [activeSession?.task_id]);

  return isActiveTaskVisible;
};