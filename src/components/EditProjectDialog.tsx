
import { useState } from 'react';
import { Project } from '@/types/productivity';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProjectForm } from './project/ProjectForm';
import { ProjectFormValues } from './project/projectFormSchema';

interface EditProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (projectId: string, updates: Partial<Project>) => void;
}

export const EditProjectDialog = ({ 
  project, 
  open, 
  onOpenChange, 
  onSave
}: EditProjectDialogProps) => {
  const handleSubmit = (values: ProjectFormValues) => {
    onSave(project.id, {
      title: values.title,
      description: values.description || undefined,
      progress: values.progress,
      dueDate: values.dueDate
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  // Convert project to form values
  const projectAsFormValues: ProjectFormValues = {
    title: project.title,
    description: project.description || '',
    progress: project.progress,
    dueDate: project.dueDate
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update your project details and progress.
          </DialogDescription>
        </DialogHeader>
        <ProjectForm 
          initialValues={projectAsFormValues}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};
