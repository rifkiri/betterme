import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { WeeklyOutput, Goal } from '@/types/productivity';

const weeklyOutputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  linkedGoalId: z.string().optional(),
});

type WeeklyOutputFormValues = z.infer<typeof weeklyOutputSchema>;

interface EditWeeklyOutputDialogProps {
  weeklyOutput: WeeklyOutput;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (outputId: string, updates: Partial<WeeklyOutput>) => Promise<void>;
  goals?: Goal[];
  onRefresh?: () => Promise<void>;
}

export const EditWeeklyOutputDialog = ({ weeklyOutput, open, onOpenChange, onSave, goals = [], onRefresh }: EditWeeklyOutputDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const getCategoryColor = (category: Goal['category']) => {
    switch (category) {
      case 'work': return 'bg-blue-100 text-blue-800';
      case 'personal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const form = useForm<WeeklyOutputFormValues>({
    resolver: zodResolver(weeklyOutputSchema),
    defaultValues: {
      title: weeklyOutput.title,
      description: weeklyOutput.description || '',
      dueDate: weeklyOutput.dueDate || undefined,
      linkedGoalId: weeklyOutput.linkedGoalId || 'none',
    }
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: weeklyOutput.title,
        description: weeklyOutput.description || '',
        dueDate: weeklyOutput.dueDate || undefined,
        linkedGoalId: weeklyOutput.linkedGoalId || 'none',
      });
    }
  }, [weeklyOutput, open, form]);

  const handleSubmit = async (values: WeeklyOutputFormValues) => {
    setIsSubmitting(true);
    try {
      console.log('EditWeeklyOutputDialog - Form values received:', values);
      console.log('EditWeeklyOutputDialog - About to call onSave with output ID:', weeklyOutput.id);
      
      // Ensure the due date is set to end of day in local time to avoid timezone issues
      let dueDate = values.dueDate;
      if (dueDate) {
        dueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 23, 59, 59, 999);
      }

      // Save the weekly output updates including the linked goal
      await onSave(weeklyOutput.id, {
        title: values.title,
        description: values.description,
        dueDate: dueDate,
        linkedGoalId: values.linkedGoalId === "none" ? "none" : values.linkedGoalId,
      });

      console.log('EditWeeklyOutputDialog - onSave completed, calling onRefresh');
      
      // Trigger data refresh to ensure bidirectional updates appear
      if (onRefresh) {
        await onRefresh();
      }
      
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  // Get today's date and set time to start of day for proper comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter active goals (not completed, not archived)
  const activeGoals = goals.filter(goal => 
    !goal.completed && !goal.archived
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Edit Weekly Output</DialogTitle>
          <DialogDescription>
            Update your weekly output details.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] px-1">
          <Form {...form}>
            <form id="weekly-output-form" onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="space-y-4 pr-2 pb-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Describe your weekly output..." {...field} />
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
                          placeholder="Enter description..." 
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date (Optional)</FormLabel>
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
                                <span>Pick a date</span>
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
                                // Create date in local timezone to avoid timezone conversion issues
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

                {/* Goal Linking Section */}
                {activeGoals.length > 0 && (
                  <FormField
                    control={form.control}
                    name="linkedGoalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link to Goal (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a goal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-50 bg-background border border-border shadow-lg">
                            <SelectItem value="none">No goal</SelectItem>
                            {activeGoals.map(goal => (
                              <SelectItem key={goal.id} value={goal.id} className="py-3">
                                <div className="flex items-center justify-between w-full gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{goal.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge className={`text-xs ${getCategoryColor(goal.category)}`}>
                                        {goal.category}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {goal.progress}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </form>
          </Form>
        </ScrollArea>
        
        <div className="flex justify-end space-x-2 pt-4 border-t shrink-0">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" form="weekly-output-form" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};