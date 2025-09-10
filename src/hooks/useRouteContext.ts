import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface RouteContext {
  isOnTasksPage: boolean;
  isTaskSectionVisible: boolean;
  hasNavigatedAway: boolean;
}

export const useRouteContext = () => {
  const location = useLocation();
  const [routeContext, setRouteContext] = useState<RouteContext>({
    isOnTasksPage: false,
    isTaskSectionVisible: false,
    hasNavigatedAway: false,
  });

  useEffect(() => {
    const isOnTasksPage = location.pathname === '/';
    const hasNavigatedAway = !isOnTasksPage;

    // Check if tasks section is visible on the current page
    const checkTaskSectionVisibility = () => {
      if (!isOnTasksPage) return false;
      
      // Look for task section element
      const taskSection = document.querySelector('[data-testid="tasks-section"], .tasks-section, #tasks-section');
      if (!taskSection) return false;
      
      // Check if the element is in viewport
      const rect = taskSection.getBoundingClientRect();
      const isVisible = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
      
      return isVisible;
    };

    const isTaskSectionVisible = checkTaskSectionVisibility();

    setRouteContext({
      isOnTasksPage,
      isTaskSectionVisible,
      hasNavigatedAway,
    });

    // Set up scroll listener for tasks page to track section visibility
    if (isOnTasksPage) {
      const handleScroll = () => {
        const visible = checkTaskSectionVisibility();
        setRouteContext(prev => ({ 
          ...prev, 
          isTaskSectionVisible: visible 
        }));
      };

      // Debounce scroll events for performance
      let scrollTimer: NodeJS.Timeout;
      const debouncedScroll = () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(handleScroll, 100);
      };

      window.addEventListener('scroll', debouncedScroll);
      window.addEventListener('resize', debouncedScroll);

      return () => {
        window.removeEventListener('scroll', debouncedScroll);
        window.removeEventListener('resize', debouncedScroll);
        clearTimeout(scrollTimer);
      };
    }
  }, [location.pathname]);

  return routeContext;
};