
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Habit } from '@/types/productivity';

const habitSchema = z.object({
  name: z.string().min(1, 'Habit name is required'),
  description: z.string().optional(),
  category: z.string().optional()
});

type HabitFormValues = z.infer<typeof habitSchema>;

interface EditHabitDialogProps {
  habit: Habit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (habitId: string, updates: Partial<Habit>) => void;
}

export const EditHabitDialog = ({ habit, open, onOpenChange, onSave }: EditHabitDialogProps) => {
  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: habit.name,
      description: habit.description || '',
      category: habit.category || ''
    }
  });

  const handleSubmit = (values: HabitFormValues) => {
    onSave(habit.id, {
      name: values.name,
      description: values.description || undefined,
      category: values.category || undefined
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Habit</DialogTitle>
          <DialogDescription>
            Update your habit details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Habit Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Morning Exercise" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your habit..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Health, Learning" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
