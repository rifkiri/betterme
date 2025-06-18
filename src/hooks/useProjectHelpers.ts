
import { Project } from '@/types/projects';
import { isBefore } from 'date-fns';

export const useProjectHelpers = (projects: Project[]) => {
  const getOverdueProjects = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return projects.filter(project => 
      !project.isDeleted && 
      project.progress < 100 && 
      project.dueDate && 
      isBefore(project.dueDate, today)
    );
  };

  return {
    getOverdueProjects
  };
};
