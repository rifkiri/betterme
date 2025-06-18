
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trash2, RotateCcw, Archive, CalendarIcon } from 'lucide-react';
import { Project } from '@/types/productivity';
import { format, isToday, isTomorrow } from 'date-fns';

interface DeletedProjectsDialogProps {
  deletedProjects: Project[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRestore: (id: string) => void;
  onPermanentlyDelete: (id: string) => void;
}

export const DeletedProjectsDialog = ({ 
  deletedProjects, 
  open,
  onOpenChange,
  onRestore,
  onPermanentlyDelete
}: DeletedProjectsDialogProps) => {
  const dialogProps = open !== undefined && onOpenChange !== undefined 
    ? { open, onOpenChange }
    : {};

  return (
    <Dialog {...dialogProps}>
      {!open && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Archive className="h-4 w-4 mr-2" />
            Deleted ({deletedProjects.length})
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Deleted Projects</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {deletedProjects.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No deleted projects</p>
          ) : (
            deletedProjects.map((project) => (
              <div key={project.id} className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 leading-relaxed mb-2">{project.title}</p>
                    {project.description && (
                      <p className="text-xs text-gray-600 mb-2">{project.description}</p>
                    )}
                    {project.dueDate && (
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        <span>
                          Due: {isToday(project.dueDate) ? 'Today' : isTomorrow(project.dueDate) ? 'Tomorrow' : format(project.dueDate, 'MMM dd')}
                        </span>
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {project.progress}%
                  </Badge>
                </div>
                
                <div className="mb-3">
                  <Progress value={project.progress} className="h-2" />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRestore(project.id)}
                    className="text-xs px-2 py-1"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onPermanentlyDelete(project.id)}
                    className="text-xs px-2 py-1"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete Forever
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
