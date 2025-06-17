
import { supabaseDataService } from '@/services/SupabaseDataService';
import { Project } from '@/types/productivity';
import { toast } from 'sonner';

interface UseProjectsManagerProps {
  userId: string | null;
  isSupabaseAvailable: () => boolean;
  loadAllData: () => Promise<void>;
  projects: Project[];
  setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
  deletedProjects: Project[];
  setDeletedProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
}

export const useProjectsManager = ({
  userId,
  isSupabaseAvailable,
  loadAllData,
  projects,
  setProjects,
  deletedProjects,
  setDeletedProjects,
}: UseProjectsManagerProps) => {
  const addProject = async (project: Omit<Project, 'id' | 'createdDate'>) => {
    if (!userId) return;

    const newProject: Project = {
      ...project,
      id: crypto.randomUUID(),
      createdDate: new Date(),
      dueDate: project.dueDate || new Date(),
      originalDueDate: project.dueDate || new Date(),
      isMoved: false,
      progress: project.progress || 0,
    };

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.addProject({ ...newProject, userId });
        await loadAllData();
        toast.success('Project added successfully');
      } else {
        toast.error('Please sign in to add projects');
      }
    } catch (error) {
      toast.error('Failed to add project');
      console.error('Failed to add project:', error);
    }
  };

  const editProject = async (id: string, updates: Partial<Project>) => {
    if (!userId) return;

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateProject(id, userId, updates);
        await loadAllData();
        toast.success('Project updated successfully');
      } else {
        toast.error('Please sign in to edit projects');
      }
    } catch (error) {
      toast.error('Failed to update project');
      console.error('Failed to update project:', error);
    }
  };

  const updateProgress = async (projectId: string, newProgress: number) => {
    if (!userId) return;

    const updates: Partial<Project> = {
      progress: newProgress,
      completedDate: newProgress === 100 ? new Date() : undefined
    };

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateProject(projectId, userId, updates);
        await loadAllData();
      } else {
        toast.error('Please sign in to update projects');
      }
    } catch (error) {
      toast.error('Failed to update progress');
      console.error('Failed to update progress:', error);
    }
  };

  const deleteProject = async (id: string) => {
    if (!userId) return;

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateProject(id, userId, { isDeleted: true, deletedDate: new Date() });
        await loadAllData();
        toast.success('Project deleted');
      } else {
        toast.error('Please sign in to delete projects');
      }
    } catch (error) {
      toast.error('Failed to delete project');
      console.error('Failed to delete project:', error);
    }
  };

  const restoreProject = async (id: string) => {
    if (!userId) return;

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.updateProject(id, userId, { isDeleted: false, deletedDate: undefined });
        await loadAllData();
        toast.success('Project restored');
      } else {
        toast.error('Please sign in to restore projects');
      }
    } catch (error) {
      toast.error('Failed to restore project');
      console.error('Failed to restore project:', error);
    }
  };

  const permanentlyDeleteProject = async (id: string) => {
    if (!userId) return;

    try {
      if (isSupabaseAvailable()) {
        await supabaseDataService.permanentlyDeleteProject(id, userId);
        await loadAllData();
        toast.success('Project permanently deleted');
      } else {
        toast.error('Please sign in to delete projects');
      }
    } catch (error) {
      toast.error('Failed to delete project');
      console.error('Failed to delete project:', error);
    }
  };

  return {
    addProject,
    editProject,
    updateProgress,
    deleteProject,
    restoreProject,
    permanentlyDeleteProject,
  };
};
