
import { Project } from '@/types/productivity';

export const useProjectHelpers = (projects: Project[]) => {
  const getOverdueProjects = (): Project[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return projects.filter(project => {
      if (project.isDeleted || project.progress === 100) return false;
      
      const dueDate = new Date(project.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      return dueDate < today;
    });
  };

  return {
    getOverdueProjects,
  };
};
