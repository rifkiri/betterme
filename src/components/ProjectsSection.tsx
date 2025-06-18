
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FolderOpen, Trash2 } from 'lucide-react';
import { AddProjectDialog } from './AddProjectDialog';
import { EditProjectDialog } from './EditProjectDialog';
import { MoveProjectDialog } from './MoveProjectDialog';
import { ProjectCard } from './ProjectCard';
import { Project } from '@/types/projects';
import { Badge } from '@/components/ui/badge';

interface ProjectsSectionProps {
  projects: Project[];
  deletedProjects: Project[];
  overdueProjects: Project[];
  onAddProject: (project: { title: string; description?: string; dueDate: Date }) => void;
  onEditProject: (projectId: string, updates: Partial<Project>) => void;
  onUpdateProgress: (projectId: string, progress: number) => void;
  onMoveProject: (projectId: string, newDueDate: Date) => void;
  onDeleteProject: (projectId: string) => void;
  onRestoreProject: (projectId: string) => void;
  onPermanentlyDeleteProject: (projectId: string) => void;
}

export const ProjectsSection = ({
  projects,
  deletedProjects,
  overdueProjects,
  onAddProject,
  onEditProject,
  onUpdateProgress,
  onMoveProject,
  onDeleteProject,
  onRestoreProject,
  onPermanentlyDeleteProject
}: ProjectsSectionProps) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [movingProject, setMovingProject] = useState<Project | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  const activeProjects = projects.filter(p => !p.isDeleted);
  const completedProjects = activeProjects.filter(p => p.progress >= 100);
  const inProgressProjects = activeProjects.filter(p => p.progress < 100);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold">Projects</CardTitle>
            {overdueProjects.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {overdueProjects.length} overdue
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {deletedProjects.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
                className="text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Deleted ({deletedProjects.length})
              </Button>
            )}
            <Button
              onClick={() => setShowAddDialog(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Project
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Active Projects */}
        {inProgressProjects.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              In Progress ({inProgressProjects.length})
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {inProgressProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={setEditingProject}
                  onUpdateProgress={onUpdateProgress}
                  onMove={setMovingProject}
                  onDelete={onDeleteProject}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Projects */}
        {completedProjects.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Completed ({completedProjects.length})
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {completedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={setEditingProject}
                  onUpdateProgress={onUpdateProgress}
                  onMove={setMovingProject}
                  onDelete={onDeleteProject}
                />
              ))}
            </div>
          </div>
        )}

        {/* Deleted Projects */}
        {showDeleted && deletedProjects.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Deleted Projects ({deletedProjects.length})
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {deletedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={setEditingProject}
                  onUpdateProgress={onUpdateProgress}
                  onMove={setMovingProject}
                  onDelete={onPermanentlyDeleteProject}
                  onRestore={onRestoreProject}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeProjects.length === 0 && (
          <div className="text-center py-8">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No projects yet</p>
            <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-1" />
              Create Your First Project
            </Button>
          </div>
        )}
      </CardContent>

      {/* Dialogs */}
      <AddProjectDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSave={onAddProject}
      />

      {editingProject && (
        <EditProjectDialog
          project={editingProject}
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
          onSave={onEditProject}
        />
      )}

      <MoveProjectDialog
        project={movingProject}
        open={!!movingProject}
        onOpenChange={(open) => !open && setMovingProject(null)}
        onMove={onMoveProject}
      />
    </Card>
  );
};
