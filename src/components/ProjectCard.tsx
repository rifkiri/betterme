
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Trash2, Link } from 'lucide-react';
import { Project, Task } from '@/types/productivity';
import { format, isToday, isTomorrow } from 'date-fns';
import { isWeeklyOutputOverdue } from '@/utils/dateUtils';
import { EditProjectDialog } from './EditProjectDialog';

interface ProjectCardProps {
  project: Project;
  onEditProject: (id: string, updates: Partial<Project>) => void;
  onUpdateProgress: (projectId: string, newProgress: number) => void;
  onDeleteProject: (id: string) => void;
  tasks?: Task[];
}

export const ProjectCard = ({
  project,
  onEditProject,
  onUpdateProgress,
  onDeleteProject,
  tasks = []
}: ProjectCardProps) => {
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const isOverdue = () => {
    return project.dueDate && isWeeklyOutputOverdue(project.dueDate, project.progress, project.completedDate, project.createdDate);
  };

  const linkedTasksCount = tasks.filter(task => 
    task.weeklyOutputId && 
    tasks.some(t => t.weeklyOutputId === task.weeklyOutputId && t.projectId === project.id)
  ).length;

  return (
    <>
      <div className={`p-4 rounded-lg border ${isOverdue() ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="cursor-pointer hover:bg-blue-100 rounded p-1 -m-1 transition-colors" onClick={() => setEditingProject(project)}>
              <p className="text-sm text-gray-700 leading-relaxed mb-2">{project.title}</p>
              {project.description && (
                <p className="text-xs text-gray-600 mb-2">{project.description}</p>
              )}
              {project.isMoved && project.originalDueDate && (
                <p className="text-xs text-orange-600 mb-1">
                  Moved from: {format(project.originalDueDate, 'MMM dd')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              {linkedTasksCount > 0 && (
                <Badge variant="outline" className="text-xs flex items-center gap-1 bg-green-50 text-green-600 border-green-200">
                  <Link className="h-2 w-2" />
                  {linkedTasksCount} task{linkedTasksCount !== 1 ? 's' : ''} linked
                </Badge>
              )}
            </div>
            {project.dueDate && (
              <div className="flex items-center text-xs text-gray-500">
                <CalendarIcon className="h-3 w-3 mr-1" />
                <span className={isOverdue() ? 'text-red-600 font-medium' : ''}>
                  Due: {isToday(project.dueDate) ? 'Today' : isTomorrow(project.dueDate) ? 'Tomorrow' : format(project.dueDate, 'MMM dd')}
                  {isOverdue() && ' (Overdue)'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={project.progress === 100 ? 'default' : isOverdue() ? 'destructive' : 'secondary'} className="text-xs">
              {project.progress}%
            </Badge>
            <Button size="sm" variant="outline" onClick={() => onDeleteProject(project.id)} className="text-xs px-2 py-1 text-red-600 hover:bg-red-50">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="mb-3">
          <Progress value={project.progress} className={`h-2 ${isOverdue() ? 'bg-red-100' : ''}`} />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={() => onUpdateProgress(project.id, project.progress - 10)} disabled={project.progress <= 0} className="text-xs px-2 py-1">
            -10%
          </Button>
          <Button size="sm" variant="outline" onClick={() => onUpdateProgress(project.id, project.progress + 10)} disabled={project.progress >= 100} className="text-xs px-2 py-1">
            +10%
          </Button>
          {project.progress !== 100 && (
            <Button size="sm" variant="default" onClick={() => onUpdateProgress(project.id, 100)} className="text-xs px-2 py-1">
              Achieved
            </Button>
          )}
        </div>
      </div>
      
      {editingProject && (
        <EditProjectDialog 
          project={editingProject} 
          open={true} 
          onOpenChange={open => !open && setEditingProject(null)} 
          onSave={onEditProject} 
        />
      )}
    </>
  );
};
