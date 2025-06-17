
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Project, Task } from '@/types/productivity';
import { WeeklyOutputCard } from './WeeklyOutputCard';

interface AllProjectsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  onEditProject: (id: string, updates: Partial<Project>) => void;
  onUpdateProgress: (projectId: string, newProgress: number) => void;
  onDeleteProject: (id: string) => void;
  tasks?: Task[];
}

export const AllProjectsModal = ({
  open,
  onOpenChange,
  projects,
  onEditProject,
  onUpdateProgress,
  onDeleteProject,
  tasks = []
}: AllProjectsModalProps) => {
  const activeProjects = projects.filter(project => project.progress < 100);
  const completedProjects = projects.filter(project => project.progress === 100);

  // Convert projects to WeeklyOutput format for reusing existing components
  const convertProjectToWeeklyOutput = (project: Project) => ({
    ...project,
    isMoved: project.isMoved || false,
    isDeleted: project.isDeleted || false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📁 All Projects
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Active Projects */}
          {activeProjects.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-blue-600">Active Projects</h3>
                <Badge variant="secondary" className="text-xs">
                  {activeProjects.length}
                </Badge>
              </div>
              <div className="grid gap-3">
                {activeProjects.map((project) => (
                  <WeeklyOutputCard
                    key={project.id}
                    output={convertProjectToWeeklyOutput(project)}
                    onEditWeeklyOutput={onEditProject}
                    onUpdateProgress={onUpdateProgress}
                    onDeleteWeeklyOutput={onDeleteProject}
                    tasks={tasks}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Projects */}
          {completedProjects.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-green-600">Completed Projects</h3>
                <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                  {completedProjects.length}
                </Badge>
              </div>
              <div className="grid gap-3">
                {completedProjects.map((project) => (
                  <WeeklyOutputCard
                    key={project.id}
                    output={convertProjectToWeeklyOutput(project)}
                    onEditWeeklyOutput={onEditProject}
                    onUpdateProgress={onUpdateProgress}
                    onDeleteWeeklyOutput={onDeleteProject}
                    tasks={tasks}
                  />
                ))}
              </div>
            </div>
          )}

          {projects.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No projects found</p>
              <p className="text-xs mt-1">Create your first project to get started!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
