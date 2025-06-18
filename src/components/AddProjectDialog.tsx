
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ProjectForm } from './project/ProjectForm';
import { ProjectFormValues } from './project/projectFormSchema';
import { Project } from '@/types/productivity';

interface AddProjectDialogProps {
  onAddProject: (project: Omit<Project, 'id' | 'createdDate'>) => void;
  buttonText?: string;
}

export const AddProjectDialog = ({ 
  onAddProject, 
  buttonText = "Add Projects"
}: AddProjectDialogProps) => {
  const [open, setOpen] = useState(false);

  const handleSubmit = (values: ProjectFormValues) => {
    onAddProject({
      title: values.title,
      description: values.description,
      progress: values.progress,
      dueDate: values.dueDate,
    });
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex-1 mr-2">
          <Plus className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Project</DialogTitle>
        </DialogHeader>
        
        <ProjectForm 
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};
