
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, RotateCcw, Trash2, Archive } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { WeeklyOutput, Task } from '@/types/productivity';
import { AddWeeklyOutputDialog } from './AddWeeklyOutputDialog';
import { WeeklyOutputCard } from './WeeklyOutputCard';
import { DeletedWeeklyOutputsDialog } from './DeletedWeeklyOutputsDialog';

interface ProjectsSectionProps {
  projects: WeeklyOutput[];
  deletedProjects: WeeklyOutput[];
  overdueProjects: WeeklyOutput[];
  tasks?: Task[];
  onAddProject: (project: Omit<WeeklyOutput, 'id' | 'createdDate'>) => void;
  onEditProject: (id: string, updates: Partial<WeeklyOutput>) => void;
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

  const activeProjects = projects.filter(project => project.progress < 100);
  const completedProjects = projects.filter(project => project.progress === 100);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            📋 Projects
            {overdueProjects.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {overdueProjects.length} overdue
              </Badge>
            )}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowDeletedProjects(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                View Deleted ({deletedProjects.length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <AddWeeklyOutputDialog onAddWeeklyOutput={onAddProject} />
        </div>

        {/* Overdue Projects */}
        {overdueProjects.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-medium text-red-600">Overdue Projects</h4>
              <Badge variant="destructive" className="text-xs">
                {overdueProjects.length}
              </Badge>
            </div>
            {overdueProjects.map((project) => (
              <WeeklyOutputCard
                key={project.id}
                output={project}
                onEditWeeklyOutput={onEditProject}
                onUpdateProgress={onUpdateProgress}
                onMoveWeeklyOutput={onMoveProject}
                onDeleteWeeklyOutput={onDeleteProject}
                tasks={tasks}
              />
            ))}
          </div>
        )}

        {/* Active Projects */}
        {activeProjects.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-medium text-blue-600">Active Projects</h4>
              <Badge variant="secondary" className="text-xs">
                {activeProjects.length}
              </Badge>
            </div>
            {activeProjects.map((project) => (
              <WeeklyOutputCard
                key={project.id}
                output={project}
                onEditWeeklyOutput={onEditProject}
                onUpdateProgress={onUpdateProgress}
                onMoveWeeklyOutput={onMoveProject}
                onDeleteWeeklyOutput={onDeleteProject}
                tasks={tasks}
              />
            ))}
          </div>
        )}

        {/* Completed Projects */}
        {completedProjects.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-medium text-green-600">Completed Projects</h4>
              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                {completedProjects.length}
              </Badge>
            </div>
            {completedProjects.map((project) => (
              <WeeklyOutputCard
                key={project.id}
                output={project}
                onEditWeeklyOutput={onEditProject}
                onUpdateProgress={onUpdateProgress}
                onMoveWeeklyOutput={onMoveProject}
                onDeleteWeeklyOutput={onDeleteProject}
                tasks={tasks}
              />
            ))}
          </div>
        )}

        {projects.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No projects yet</p>
            <p className="text-xs mt-1">Add your first project to get started!</p>
          </div>
        )}
      </CardContent>

      {showDeletedProjects && (
        <DeletedWeeklyOutputsDialog
          deletedWeeklyOutputs={deletedProjects}
          onRestore={onRestoreProject}
          onPermanentlyDelete={onPermanentlyDeleteProject}
        />
      )}
    </Card>
  );
};
