
import { useState } from 'react';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { Project } from '@/types/projects';
import { toast } from 'sonner';

interface UseProjectsManagerProps {
  userId: string | null;
  isSupabaseAvailable: boolean;
  loadAllData: () => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  deletedProjects: Project[];
  setDeletedProjects: (projects: Project[]) => void;
}

export const useProjectsManager = ({
  userId,
  isSupabaseAvailable,
  loadAllData,
  projects,
  setProjects,
  deletedProjects,
  setDeletedProjects
}: UseProjectsManagerProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const addProject = async (projectData: { title: string; description?: string; dueDate: Date }) => {
    if (!userId || !isSupabaseAvailable) {
      toast.error('Please sign in to add projects');
      return;
    }

    setIsLoading(true);
    try {
      const newProject: Omit<Project, 'id'> = {
        userId,
        title: projectData.title,
        description: projectData.description,
        progress: 0,
        createdDate: new Date(),
        dueDate: projectData.dueDate,
        originalDueDate: projectData.dueDate,
        isDeleted: false
      };

      const savedProject = await supabaseDataService.addProject(newProject);
      setProjects([savedProject, ...projects]);
      toast.success('Project added successfully');
    } catch (error) {
      console.error('Failed to add project:', error);
      toast.error('Failed to add project');
    } finally {
      setIsLoading(false);
    }
  };

  const editProject = async (projectId: string, updates: Partial<Project>) => {
    if (!userId || !isSupabaseAvailable) {
      toast.error('Please sign in to edit projects');
      return;
    }

    setIsLoading(true);
    try {
      await supabaseDataService.updateProject(projectId, userId, updates);
      
      setProjects(projects.map(project => 
        project.id === projectId ? { ...project, ...updates } : project
      ));
      
      toast.success('Project updated successfully');
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error('Failed to update project');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProgress = async (projectId: string, progress: number) => {
    if (!userId || !isSupabaseAvailable) {
      toast.error('Please sign in to update progress');
      return;
    }

    setIsLoading(true);
    try {
      const updates: Partial<Project> = { 
        progress,
        completedDate: progress >= 100 ? new Date() : undefined
      };
      
      await supabaseDataService.updateProject(projectId, userId, updates);
      
      setProjects(projects.map(project => 
        project.id === projectId ? { ...project, ...updates } : project
      ));
      
      toast.success(progress >= 100 ? 'Project completed!' : 'Progress updated');
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast.error('Failed to update progress');
    } finally {
      setIsLoading(false);
    }
  };

  const moveProject = async (projectId: string, newDueDate: Date) => {
    if (!userId || !isSupabaseAvailable) {
      toast.error('Please sign in to move projects');
      return;
    }

    setIsLoading(true);
    try {
      const updates: Partial<Project> = { 
        dueDate: newDueDate,
        isMoved: true
      };
      
      await supabaseDataService.updateProject(projectId, userId, updates);
      
      setProjects(projects.map(project => 
        project.id === projectId ? { ...project, ...updates } : project
      ));
      
      toast.success('Project due date updated');
    } catch (error) {
      console.error('Failed to move project:', error);
      toast.error('Failed to move project');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!userId || !isSupabaseAvailable) {
      toast.error('Please sign in to delete projects');
      return;
    }

    setIsLoading(true);
    try {
      const updates: Partial<Project> = { 
        isDeleted: true,
        deletedDate: new Date()
      };
      
      await supabaseDataService.updateProject(projectId, userId, updates);
      
      const projectToDelete = projects.find(p => p.id === projectId);
      if (projectToDelete) {
        setProjects(projects.filter(p => p.id !== projectId));
        setDeletedProjects([{ ...projectToDelete, ...updates }, ...deletedProjects]);
      }
      
      toast.success('Project deleted');
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    } finally {
      setIsLoading(false);
    }
  };

  const restoreProject = async (projectId: string) => {
    if (!userId || !isSupabaseAvailable) {
      toast.error('Please sign in to restore projects');
      return;
    }

    setIsLoading(true);
    try {
      const updates: Partial<Project> = { 
        isDeleted: false,
        deletedDate: undefined
      };
      
      await supabaseDataService.updateProject(projectId, userId, updates);
      
      const projectToRestore = deletedProjects.find(p => p.id === projectId);
      if (projectToRestore) {
        setDeletedProjects(deletedProjects.filter(p => p.id !== projectId));
        setProjects([{ ...projectToRestore, ...updates }, ...projects]);
      }
      
      toast.success('Project restored');
    } catch (error) {
      console.error('Failed to restore project:', error);
      toast.error('Failed to restore project');
    } finally {
      setIsLoading(false);
    }
  };

  const permanentlyDeleteProject = async (projectId: string) => {
    if (!userId || !isSupabaseAvailable) {
      toast.error('Please sign in to delete projects');
      return;
    }

    setIsLoading(true);
    try {
      await supabaseDataService.permanentlyDeleteProject(projectId, userId);
      
      setDeletedProjects(deletedProjects.filter(p => p.id !== projectId));
      
      toast.success('Project permanently deleted');
    } catch (error) {
      console.error('Failed to permanently delete project:', error);
      toast.error('Failed to permanently delete project');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addProject,
    editProject,
    updateProgress,
    moveProject,
    deleteProject,
    restoreProject,
    permanentlyDeleteProject,
    isLoading
  };
};
