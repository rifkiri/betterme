
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MoreHorizontal, Calendar, Edit, Trash2, RotateCcw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import { Project } from '@/types/projects';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onUpdateProgress: (projectId: string, progress: number) => void;
  onMove: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onRestore?: (projectId: string) => void;
}

export const ProjectCard = ({ 
  project, 
  onEdit, 
  onUpdateProgress, 
  onMove, 
  onDelete,
  onRestore 
}: ProjectCardProps) => {
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  const today = new Date();
  const daysUntilDue = differenceInDays(project.dueDate, today);
  const isOverdue = isBefore(project.dueDate, today) && project.progress < 100;
  const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0 && project.progress < 100;

  const handleProgressClick = () => {
    if (project.progress >= 100) return;
    
    setIsUpdatingProgress(true);
    const newProgress = Math.min(project.progress + 10, 100);
    onUpdateProgress(project.id, newProgress);
    setTimeout(() => setIsUpdatingProgress(false), 300);
  };

  const getStatusColor = () => {
    if (project.progress >= 100) return 'text-green-600';
    if (isOverdue) return 'text-red-600';
    if (isDueSoon) return 'text-orange-600';
    return 'text-blue-600';
  };

  const getProgressColor = () => {
    if (project.progress >= 100) return 'bg-green-500';
    if (isOverdue) return 'bg-red-500';
    if (isDueSoon) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", {
      "border-red-200 bg-red-50": isOverdue,
      "border-orange-200 bg-orange-50": isDueSoon,
      "border-green-200 bg-green-50": project.progress >= 100,
      "opacity-60": project.isDeleted
    })}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium line-clamp-2 flex-1 mr-2">
            {project.title}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!project.isDeleted ? (
                <>
                  <DropdownMenuItem onClick={() => onEdit(project)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onMove(project)}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Move Date
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(project.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => onRestore?.(project.id)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {project.description && (
          <p className="text-xs text-gray-600 line-clamp-2 mt-1">
            {project.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className={cn("font-medium", getStatusColor())}>
              {project.progress}% Complete
            </span>
            <span className="text-gray-500">
              Due {format(project.dueDate, 'MMM d')}
            </span>
          </div>
          
          <div 
            className={cn("cursor-pointer transition-all duration-200", {
              "cursor-not-allowed": project.progress >= 100 || project.isDeleted,
              "hover:scale-105": project.progress < 100 && !project.isDeleted
            })}
            onClick={handleProgressClick}
          >
            <Progress 
              value={project.progress} 
              className={cn("h-2 transition-all duration-300", {
                "animate-pulse": isUpdatingProgress
              })}
              style={{
                '--progress-background': getProgressColor()
              } as React.CSSProperties}
            />
          </div>
          
          {isOverdue && (
            <p className="text-xs text-red-600 font-medium">
              Overdue by {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 ? 's' : ''}
            </p>
          )}
          
          {isDueSoon && !isOverdue && (
            <p className="text-xs text-orange-600 font-medium">
              Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
            </p>
          )}
          
          {project.progress >= 100 && (
            <p className="text-xs text-green-600 font-medium">
              ✓ Completed
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
