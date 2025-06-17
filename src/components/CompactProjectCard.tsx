
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Trash2, Link, MoreHorizontal } from 'lucide-react';
import { Project, Task } from '@/types/productivity';
import { format, isToday, isTomorrow } from 'date-fns';
import { EditWeeklyOutputDialog } from './EditWeeklyOutputDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface CompactProjectCardProps {
  project: Project;
  onEditProject: (id: string, updates: Partial<Project>) => void;
  onUpdateProgress: (projectId: string, newProgress: number) => void;
  onMoveProject: (id: string, newDueDate: Date) => void;
  onDeleteProject: (id: string) => void;
  tasks?: Task[];
  isOverdue?: boolean;
}

export const CompactProjectCard = ({
  project,
  onEditProject,
  onUpdateProgress,
  onMoveProject,
  onDeleteProject,
  tasks = [],
  isOverdue = false
}: CompactProjectCardProps) => {
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const linkedTasksCount = tasks.filter(task => task.projectId === project.id).length;

  // Convert project to WeeklyOutput format for EditWeeklyOutputDialog
  const projectAsWeeklyOutput = {
    ...project,
    isMoved: project.isMoved || false,
    isDeleted: project.isDeleted || false,
  };

  return (
    <>
      <div className={`p-3 rounded-lg border transition-colors ${
        isOverdue ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div 
              className="cursor-pointer"
              onClick={() => setEditingProject(project)}
            >
              <p className="text-sm font-medium text-gray-800 truncate">{project.title}</p>
              {project.description && (
                <p className="text-xs text-gray-600 truncate mt-1">{project.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-2">
            <Badge variant={project.progress === 100 ? 'default' : isOverdue ? 'destructive' : 'secondary'} className="text-xs">
              {project.progress}%
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onUpdateProgress(project.id, Math.max(0, project.progress - 10))} disabled={project.progress <= 0}>
                  -10%
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateProgress(project.id, Math.min(100, project.progress + 10))} disabled={project.progress >= 100}>
                  +10%
                </DropdownMenuItem>
                {project.progress !== 100 && (
                  <DropdownMenuItem onClick={() => onUpdateProgress(project.id, 100)}>
                    Mark Complete
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDeleteProject(project.id)} className="text-red-600">
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="mb-2">
          <Progress value={project.progress} className={`h-1.5 ${isOverdue ? 'bg-red-100' : ''}`} />
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {linkedTasksCount > 0 && (
              <Badge variant="outline" className="text-xs flex items-center gap-1 bg-green-50 text-green-600 border-green-200 px-1 py-0">
                <Link className="h-2 w-2" />
                {linkedTasksCount}
              </Badge>
            )}
            
            {project.isMoved && project.originalDueDate && (
              <span className="text-orange-600">Moved</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {project.dueDate && (
              <div className="flex items-center text-gray-500">
                <CalendarIcon className="h-3 w-3 mr-1" />
                <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                  {isToday(project.dueDate) ? 'Today' : isTomorrow(project.dueDate) ? 'Tomorrow' : format(project.dueDate, 'MMM dd')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {editingProject && (
        <EditWeeklyOutputDialog 
          weeklyOutput={projectAsWeeklyOutput} 
          open={true} 
          onOpenChange={open => !open && setEditingProject(null)} 
          onSave={onEditProject} 
        />
      )}
    </>
  );
};
