
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Project } from '@/types/projects';

const moveProjectSchema = z.object({
  newDueDate: z.date({ required_error: 'New due date is required' })
});

type MoveProjectFormValues = z.infer<typeof moveProjectSchema>;

interface MoveProjectDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMove: (projectId: string, newDueDate: Date) => void;
}

export const MoveProjectDialog = ({ project, open, onOpenChange, onMove }: MoveProjectDialogProps) => {
  const form = useForm<MoveProjectFormValues>({
    resolver: zodResolver(moveProjectSchema),
    defaultValues: {
      newDueDate: undefined
    }
  });

  const handleSubmit = (values: MoveProjectFormValues) => {
    if (!project) return;
    
    const newDueDate = new Date(values.newDueDate.getFullYear(), values.newDueDate.getMonth(), values.newDueDate.getDate(), 23, 59, 59, 999);
    onMove(project.id, newDueDate);
    form.reset();
    onOpenChange(false);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Move Project Due Date</DialogTitle>
          <DialogDescription>
            {project && `Change the due date for "${project.title}"`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newDueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a new date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                            field.onChange(localDate);
                          } else {
                            field.onChange(date);
                          }
                        }}
                        disabled={(date) => {
                          const dateToCheck = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                          return dateToCheck < today;
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Move Project</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
