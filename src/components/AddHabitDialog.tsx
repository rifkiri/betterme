
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getCategoryOptions, mapDisplayToDatabase } from '@/utils/habitCategoryUtils';
import { useGoals } from '@/hooks/useGoals';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const formSchema = z.object({
  name: z.string().min(1, 'Habit name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  linkedGoalId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddHabitDialogProps {
  onAddHabit: (habit: { name: string; description?: string; category?: string; linkedGoalId?: string }) => void;
}

const categoryOptions = getCategoryOptions();

export const AddHabitDialog = ({ onAddHabit }: AddHabitDialogProps) => {
  const [open, setOpen] = useState(false);
  const { currentUser } = useCurrentUser();
  const { goals } = useGoals();

  // Filter to personal goals only for habit linking
  const personalGoals = goals?.filter(goal => 
    goal.category === 'personal' && 
    !goal.archived && 
    !goal.completed
  ) || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      linkedGoalId: 'none',
    },
  });

  const onSubmit = (values: FormValues) => {
    onAddHabit({
      name: values.name,
      description: values.description || undefined,
      category: values.category === 'none' ? undefined : mapDisplayToDatabase(values.category),
      linkedGoalId: values.linkedGoalId === 'none' ? undefined : values.linkedGoalId,
    });
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Habit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Add New Habit</DialogTitle>
          <DialogDescription>
            Create a new daily habit to track your progress.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
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
                    <Textarea 
                      placeholder="Describe your habit..."
                      className="resize-none"
                      {...field}
                    />
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
                    <SelectContent>
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
        
        <div className="flex justify-end space-x-2 pt-4 border-t shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            Add Habit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
