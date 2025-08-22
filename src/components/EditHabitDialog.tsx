import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Habit } from '@/types/productivity';
import { getCategoryOptions, mapDisplayToDatabase, mapDatabaseToDisplay } from '@/utils/habitCategoryUtils';
import { useGoals } from '@/hooks/useGoals';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const habitSchema = z.object({
  name: z.string().min(1, 'Habit name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  linkedGoalId: z.string().optional(),
});

type HabitFormValues = z.infer<typeof habitSchema>;

interface EditHabitDialogProps {
  habit: Habit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  onRefresh?: () => void;
}

const categoryOptions = getCategoryOptions();

export const EditHabitDialog = ({ habit, open, onOpenChange, onSave, onRefresh }: EditHabitDialogProps) => {
  const { goals } = useGoals();

  // Filter to personal goals only for habit linking  
  const personalGoals = goals?.filter(goal => 
    goal.category === 'personal' && 
    !goal.archived && 
    !goal.completed
  ) || [];

  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: habit.name,
      description: habit.description || '',
      category: habit.category ? mapDatabaseToDisplay(habit.category) : 'none',
      linkedGoalId: habit.linkedGoalId || 'none'
    }
  });

  const handleSubmit = async (values: HabitFormValues) => {
    console.log('EditHabitDialog - Form submitted with values:', values);
    console.log('EditHabitDialog - Original habit linkedGoalId:', habit.linkedGoalId);
    console.log('EditHabitDialog - About to call onSave with habit ID:', habit.id);
    
    const updates = {
      name: values.name,
      description: values.description || undefined,
      category: values.category === 'none' ? undefined : mapDisplayToDatabase(values.category),
      linkedGoalId: values.linkedGoalId === 'none' ? 'none' : values.linkedGoalId
    };
    
    console.log('EditHabitDialog - Sending updates to onSave:', updates);
    console.log('EditHabitDialog - linkedGoalId will be set to:', updates.linkedGoalId);
    
    await onSave(habit.id, updates);
    
    console.log('EditHabitDialog - onSave completed, calling onRefresh');
    onRefresh?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Edit Habit</DialogTitle>
          <DialogDescription>
            Update your habit details.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-1">
          <Form {...form}>
            <form id="edit-habit-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background z-50 max-h-60">
                      <SelectItem value="none">No category</SelectItem>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkedGoalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link to Personal Goal (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a personal goal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-50 bg-background border border-border shadow-lg">
                      <SelectItem value="none">No goal</SelectItem>
                      {personalGoals.map(goal => (
                        <SelectItem key={goal.id} value={goal.id} className="py-3">
                          <div className="flex items-center justify-between w-full gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{goal.title}</div>
                              <div className="text-xs text-muted-foreground">Progress: {goal.progress}%</div>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs shrink-0">
                              personal
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            </form>
          </Form>
        </ScrollArea>
        
        <div className="flex justify-end space-x-2 pt-4 shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="edit-habit-form">Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
