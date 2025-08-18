import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Plus, Target, Users, UserCog, UserCheck, User, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { Goal } from '@/types/productivity';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['work', 'personal']),
  deadline: z.date().optional(),
  coachId: z.string().optional(),
  leadId: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SimpleAddGoalDialogProps {
  onAddGoal: (goal: Omit<Goal, 'id' | 'progress' | 'createdDate'>) => void;
  availableUsers?: Array<{ id: string; name: string; role: string }>;
  currentUserId?: string;
}

export const SimpleAddGoalDialog = ({ 
  onAddGoal, 
  availableUsers = [], 
  currentUserId 
}: SimpleAddGoalDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'personal',
      deadline: undefined,
      coachId: '',
      leadId: '',
      memberIds: [],
    },
  });

  const watchCategory = form.watch('category');

  const onSubmit = (data: FormData) => {
    let deadline = data.deadline;
    if (deadline) {
      deadline = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate(), 23, 59, 59, 999);
    }

    onAddGoal({
      title: data.title,
      description: data.description,
      category: data.category,
      deadline: deadline,
      completed: false,
      archived: false,
      linkedOutputIds: [],
      coachId: data.category === 'work' ? (selectedCoach || undefined) : undefined,
      leadIds: data.category === 'work' ? (selectedLead ? [selectedLead] : undefined) : undefined,
      memberIds: data.category === 'work' ? (selectedMembers.length > 0 ? selectedMembers : undefined) : undefined,
      createdBy: data.category === 'work' ? currentUserId : undefined,
    });

    form.reset();
    setSelectedCoach('');
    setSelectedLead('');
    setSelectedMembers([]);
    setOpen(false);
  };

  const addMember = (userId: string) => {
    if (!selectedMembers.includes(userId)) {
      setSelectedMembers(prev => [...prev, userId]);
    }
  };

  const removeMember = (userId: string) => {
    setSelectedMembers(prev => prev.filter(id => id !== userId));
  };

  const getSelectedUsers = (type: 'coach' | 'lead' | 'member') => {
    if (type === 'coach') {
      return selectedCoach ? availableUsers.filter(u => u.id === selectedCoach) : [];
    }
    if (type === 'lead') {
      return selectedLead ? availableUsers.filter(u => u.id === selectedLead) : [];
    }
    return availableUsers.filter(u => selectedMembers.includes(u.id));
  };

  const getAvailableMembers = () => {
    return availableUsers.filter(user => !selectedMembers.includes(user.id));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Add New Goal
          </DialogTitle>
          <DialogDescription>
            Create a new goal to track your progress. Anyone can create work goals for team collaboration.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter goal title" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your goal..." 
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
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline (Optional)</FormLabel>
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
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Work Goal Role Assignments */}
            {watchCategory === 'work' && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h3 className="font-medium text-blue-900 mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Role Assignments (Optional)
                </h3>
                
                {/* Coach Selection */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">Coach</span>
                  </div>
                  <Select value={selectedCoach} onValueChange={(value) => setSelectedCoach(value === 'none' ? '' : value)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select a coach (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="none">No coach assigned</SelectItem>
                      {availableUsers.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {getSelectedUsers('coach').map(user => (
                    <Badge key={user.id} variant="secondary" className="bg-blue-100 text-blue-800">
                      <UserCog className="h-3 w-3 mr-1" />
                      {user.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => setSelectedCoach('')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Lead Selection */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">Lead</span>
                  </div>
                  <Select value={selectedLead} onValueChange={(value) => setSelectedLead(value === 'none' ? '' : value)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select a lead (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="none">No lead assigned</SelectItem>
                      {availableUsers.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {getSelectedUsers('lead').map(user => (
                    <Badge key={user.id} variant="secondary" className="bg-green-100 text-green-800">
                      <UserCheck className="h-3 w-3 mr-1" />
                      {user.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => setSelectedLead('')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Members Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-sm">Members</span>
                  </div>
                  {getAvailableMembers().length > 0 && (
                    <Select value="" onValueChange={(value) => value !== '' && addMember(value)}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Add a member (optional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {getAvailableMembers().map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {getSelectedUsers('member').map(user => (
                      <Badge key={user.id} variant="secondary" className="bg-purple-100 text-purple-800">
                        <User className="h-3 w-3 mr-1" />
                        {user.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => removeMember(user.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            </form>
          </Form>
        </ScrollArea>
        
        <div className="flex justify-end gap-3 pt-4 border-t shrink-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            Create Goal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};