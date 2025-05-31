import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { WeeklyOutput } from '@/types/productivity';

const formSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['High', 'Medium', 'Low']),
  estimatedTime: z.string().optional(),
  dueDate: z.date().optional(),
  weeklyOutputId: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface AddTaskDialogProps {
  onAddTask: (task: {
    title: string;
    description?: string;
    priority: 'High' | 'Medium' | 'Low';
    estimatedTime?: string;
    dueDate?: Date;
    weeklyOutputId?: string;
  }) => void;
  weeklyOutputs: WeeklyOutput[];
}

export const AddTaskDialog = ({
  onAddTask,
  weeklyOutputs
}: AddTaskDialogProps) => {
  const [open, setOpen] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'Medium',
      estimatedTime: '',
      dueDate: new Date(),
      weeklyOutputId: undefined
    }
  });

  const onSubmit = (values: FormValues) => {
    onAddTask({
      title: values.title,
      description: values.description || undefined,
      priority: values.priority,
      estimatedTime: values.estimatedTime || undefined,
      dueDate: values.dueDate,
      weeklyOutputId: values.weeklyOutputId || undefined
    });
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Create a new task to track your work progress.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField 
              control={form.control} 
              name="title" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Complete project proposal" {...field} />
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
                    <Textarea placeholder="Describe your task..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />
            
            <FormField 
              control={form.control} 
              name="priority" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} 
            />
            
            <FormField 
              control={form.control} 
              name="estimatedTime" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Time (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 2h, 30m" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />

            <FormField 
              control={form.control} 
              name="weeklyOutputId" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link to Weekly Output (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a weekly output" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No weekly output</SelectItem>
                      {weeklyOutputs.map((output) => (
                        <SelectItem key={output.id} value={output.id}>
                          {output.title}
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
              name="dueDate" 
              render={({ field }) => (
                <FormItem className="flex flex-col">
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
                        onSelect={field.onChange} 
                        disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                        initialFocus 
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} 
            />
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Task</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
