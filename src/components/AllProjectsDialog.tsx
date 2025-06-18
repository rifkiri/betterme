
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ProjectCard } from './ProjectCard';
import { Project } from '@/types/projects';
import { FolderOpen, Eye, EyeOff } from 'lucide-react';

interface AllProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  onEditProject: (project: Project) => void;
  onUpdateProgress: (projectId: string, progress: number) => void;
  onMoveProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export const AllProjectsDialog = ({
  open,
  onOpenChange,
  projects,
  onEditProject,
  onUpdateProgress,
  onMoveProject,
  onDeleteProject
}: AllProjectsDialogProps) => {
  const [showCompleted, setShowCompleted] = useState(true);

  const activeProjects = projects.filter(p => !p.isDeleted);
  const completedProjects = activeProjects.filter(p => p.progress >= 100);
  const inProgressProjects = activeProjects.filter(p => p.progress < 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-600" />
              <DialogTitle>All Projects ({activeProjects.length})</DialogTitle>
            </div>
            {completedProjects.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
                className="text-xs"
              >
                {showCompleted ? (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hide Completed
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Show Completed ({completedProjects.length})
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* In Progress Projects */}
          {inProgressProjects.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                In Progress ({inProgressProjects.length})
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {inProgressProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={onEditProject}
                    onUpdateProgress={onUpdateProgress}
                    onMove={onMoveProject}
                    onDelete={onDeleteProject}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Projects */}
          {showCompleted && completedProjects.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Completed ({completedProjects.length})
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {completedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={onEditProject}
                    onUpdateProgress={onUpdateProgress}
                    onMove={onMoveProject}
                    onDelete={onDeleteProject}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {activeProjects.length === 0 && (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No projects found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
