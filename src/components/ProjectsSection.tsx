
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Trash2, FolderOpen, Plus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Project, Task } from '@/types/productivity';
import { AddWeeklyOutputDialog } from './AddWeeklyOutputDialog';
import { CompactProjectCard } from './CompactProjectCard';
import { DeletedWeeklyOutputsDialog } from './DeletedWeeklyOutputsDialog';
import { AllProjectsModal } from './AllProjectsModal';

interface ProjectsSectionProps {
  projects: Project[];
  deletedProjects: Project[];
  overdueProjects: Project[];
  tasks?: Task[];
  onAddProject: (project: Omit<Project, 'id' | 'createdDate'>) => void;
  onEditProject: (id: string, updates: Partial<Project>) => void;
  onUpdateProgress: (projectId: string, newProgress: number) => void;
  onMoveProject: (id: string, newDueDate: Date) => void;
  onDeleteProject: (id: string) => void;
  onRestoreProject: (id: string) => void;
  onPermanentlyDeleteProject: (id: string) => void;
}

export const ProjectsSection = ({
  projects,
  deletedProjects,
  overdueProjects,
  tasks = [],
  onAddProject,
  onEditProject,
  onUpdateProgress,
  onMoveProject,
  onDeleteProject,
  onRestoreProject,
  onPermanentlyDeleteProject,
}: ProjectsSectionProps) => {
  const [showDeletedProjects, setShowDeletedProjects] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);

  const activeProjects = projects.filter(project => project.progress < 100);

  // Convert projects to WeeklyOutput format for reusing existing components
  const convertProjectToWeeklyOutput = (project: Project) => ({
    ...project,
    isMoved: project.isMoved || false,
    isDeleted: project.isDeleted || false,
  });

  return (
    <Card className="h-fit">
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              📁 Projects
              {overdueProjects.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {overdueProjects.length} overdue
                </Badge>
              )}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeletedProjects(true)}
              className="flex items-center gap-2 text-xs px-2 py-1"
            >
              <Trash2 className="h-3 w-3" />
              Deleted ({deletedProjects.length})
            </Button>
            <AddWeeklyOutputDialog onAddWeeklyOutput={onAddProject} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllProjects(true)}
            className="flex items-center gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            View All Projects
          </Button>
        </div>

        {/* Active Projects Only */}
        {activeProjects.length > 0 ? (
          <div className="grid gap-2">
            {activeProjects.map((project) => (
              <CompactProjectCard
                key={project.id}
                project={project}
                onEditProject={onEditProject}
                onUpdateProgress={onUpdateProgress}
                onMoveProject={onMoveProject}
                onDeleteProject={onDeleteProject}
                tasks={tasks}
                isOverdue={overdueProjects.some(op => op.id === project.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">No active projects</p>
            <p className="text-xs mt-1">Add your first project to get started!</p>
          </div>
        )}
      </CardContent>

      {/* All Projects Modal */}
      {showAllProjects && (
        <AllProjectsModal
          open={showAllProjects}
          onOpenChange={setShowAllProjects}
          projects={projects}
          onEditProject={onEditProject}
          onUpdateProgress={onUpdateProgress}
          onMoveProject={onMoveProject}
          onDeleteProject={onDeleteProject}
          tasks={tasks}
        />
      )}

      {/* Deleted Projects Modal */}
      {showDeletedProjects && (
        <DeletedWeeklyOutputsDialog
          open={showDeletedProjects}
          onOpenChange={setShowDeletedProjects}
          deletedWeeklyOutputs={deletedProjects.map(convertProjectToWeeklyOutput)}
          onRestore={onRestoreProject}
          onPermanentlyDelete={onPermanentlyDeleteProject}
          title="Deleted Projects"
        />
      )}
    </Card>
  );
};
