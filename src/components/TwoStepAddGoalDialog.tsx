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
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Plus, Target, Users, UserCog, UserCheck, User, X, Info, ArrowRight, ArrowLeft, SkipForward } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { Goal, GoalAssignment } from '@/types/productivity';
import { getSubcategoryOptions, mapSubcategoryDisplayToDatabase } from '@/utils/goalCategoryUtils';
import { GoalVisibilitySelector, GoalVisibility } from '@/components/ui/GoalVisibilitySelector';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['work', 'personal']),
  subcategory: z.string().optional(),
  deadline: z.date().optional(),
  visibility: z.enum(['all', 'managers', 'self']).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TwoStepAddGoalDialogProps {
  onAddGoal: (goal: Omit<Goal, 'id' | 'progress' | 'createdDate'>) => Promise<string | undefined>;
  onCreateAssignment: (assignment: Omit<GoalAssignment, 'id' | 'assignedDate'>, goalCreatorId?: string) => Promise<void>;
  availableUsers?: Array<{ id: string; name: string; role: string }>;
  currentUserId?: string;
  userRole?: string;
}

type Step = 'details' | 'members';

export const TwoStepAddGoalDialog = ({ 
  onAddGoal, 
  onCreateAssignment,
  availableUsers = [], 
  currentUserId,
  userRole
}: TwoStepAddGoalDialogProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('details');
  const [isCreating, setIsCreating] = useState(false);
  
  // Member selections for step 2
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  // Store goal data from step 1
  const [pendingGoalData, setPendingGoalData] = useState<FormData | null>(null);
  
  // Derive role flags from prop
  const isTeamMember = userRole === 'team-member';
  const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'personal',
      subcategory: '',
      deadline: undefined,
      visibility: 'all',
    },
  });

  const watchCategory = form.watch('category');

  const resetDialog = () => {
    form.reset();
    setStep('details');
    setSelectedCoach('');
    setSelectedLead('');
    setSelectedMembers([]);
    setPendingGoalData(null);
    setIsCreating(false);
  };

  const handleClose = () => {
    setOpen(false);
    resetDialog();
  };

  // Step 1: Validate and move to step 2
  const handleNextStep = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;
    
    const data = form.getValues();
    setPendingGoalData(data);
    
    // For personal goals, skip to create immediately (no members)
    if (data.category === 'personal') {
      await createGoal(data);
    } else {
      setStep('members');
    }
  };

  // Step 2: Go back to step 1
  const handleBackStep = () => {
    setStep('details');
  };

  // Create goal with or without assignments
  const createGoal = async (data: FormData, skipAssignments: boolean = false) => {
    if (!currentUserId) return;
    
    setIsCreating(true);
    
    try {
      let deadline = data.deadline;
      if (deadline) {
        deadline = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate(), 23, 59, 59, 999);
      }

      // Create the goal and get the ID
      const goalId = await onAddGoal({
        title: data.title,
        description: data.description,
        category: data.category,
        subcategory: mapSubcategoryDisplayToDatabase(data.subcategory),
        deadline: deadline,
        completed: false,
        archived: false,
        createdBy: data.category === 'work' ? currentUserId : undefined,
        visibility: data.category === 'work' ? (isTeamMember ? 'all' : (data.visibility || 'all')) : undefined,
      });

      // Create assignments if this is a work goal and we have a goal ID
      if (goalId && data.category === 'work' && !skipAssignments) {
        const assignmentPromises: Promise<void>[] = [];

        // Add coach assignment
        if (selectedCoach) {
          assignmentPromises.push(
            onCreateAssignment({
              goalId,
              userId: selectedCoach,
              role: 'coach',
              assignedBy: currentUserId,
              acknowledged: false,
              selfAssigned: false,
            })
          );
        }

        // Add lead assignment
        if (selectedLead) {
          assignmentPromises.push(
            onCreateAssignment({
              goalId,
              userId: selectedLead,
              role: 'lead',
              assignedBy: currentUserId,
              acknowledged: false,
              selfAssigned: false,
            })
          );
        }

        // Add member assignments
        for (const memberId of selectedMembers) {
          assignmentPromises.push(
            onCreateAssignment({
              goalId,
              userId: memberId,
              role: 'member',
              assignedBy: currentUserId,
              acknowledged: false,
              selfAssigned: false,
            })
          );
        }

        if (assignmentPromises.length > 0) {
          await Promise.all(assignmentPromises);
        }
      }

      handleClose();
    } catch (error) {
      console.error('Failed to create goal:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle final submission
  const handleCreateGoal = async () => {
    if (!pendingGoalData) return;
    await createGoal(pendingGoalData, false);
  };

  // Skip member assignment
  const handleSkipMembers = async () => {
    if (!pendingGoalData) return;
    await createGoal(pendingGoalData, true);
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

  const hasAnyAssignments = selectedCoach || selectedLead || selectedMembers.length > 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Add New Goal
          </DialogTitle>
          <DialogDescription>
            {step === 'details' 
              ? 'Step 1 of 2: Enter goal details'
              : 'Step 2 of 2: Add team members (optional)'}
          </DialogDescription>
          
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-3">
            <div className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
              step === 'details' 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            )}>
              1
            </div>
            <div className="flex-1 h-0.5 bg-muted" />
            <div className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
              step === 'members' 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            )}>
              2
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          {step === 'details' ? (
            // Step 1: Goal Details
            <div className="pb-4">
              <Form {...form}>
                <form className="space-y-4">
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
                    name="subcategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategory (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subcategory" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No subcategory</SelectItem>
                            {getSubcategoryOptions(watchCategory).map((subcategory) => (
                              <SelectItem key={subcategory} value={subcategory}>
                                {subcategory}
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

                  {/* Visibility Selector for Work Goals - Managers/Admins Only */}
                  {watchCategory === 'work' && isManagerOrAdmin && (
                    <FormField
                      control={form.control}
                      name="visibility"
                      render={({ field }) => (
                        <FormItem>
                          <GoalVisibilitySelector 
                            value={field.value as GoalVisibility || 'all'}
                            onChange={field.onChange}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Transparency notice for team members */}
                  {watchCategory === 'work' && isTeamMember && (
                    <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Goal visibility is managed by your managers</span>
                    </div>
                  )}

                  {/* Work goal info about next step */}
                  {watchCategory === 'work' && (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md flex items-start gap-2">
                      <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>In the next step, you can optionally assign team members to this goal</span>
                    </div>
                  )}
                </form>
              </Form>
            </div>
          ) : (
            // Step 2: Member Assignment
            <div className="pb-4 space-y-4">
              <Card className="p-4 bg-muted/30">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Role Assignments
                </h3>
                
                {/* Coach Selection */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">Coach</span>
                  </div>

                  <Select value={selectedCoach} onValueChange={(value) => setSelectedCoach(value === 'none' ? '' : value)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select a coach (optional)" />
                    </SelectTrigger>
                    <SelectContent>
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
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select a lead (optional)" />
                    </SelectTrigger>
                    <SelectContent>
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
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Add a member (optional)" />
                      </SelectTrigger>
                      <SelectContent>
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

              {/* Summary */}
              {hasAnyAssignments && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  <strong>Summary:</strong> {[
                    selectedCoach ? '1 Coach' : null,
                    selectedLead ? '1 Lead' : null,
                    selectedMembers.length > 0 ? `${selectedMembers.length} Member${selectedMembers.length > 1 ? 's' : ''}` : null
                  ].filter(Boolean).join(', ')} will be assigned to this goal.
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        <div className="flex justify-between pt-4 border-t shrink-0">
          {step === 'details' ? (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleNextStep}
                disabled={isCreating}
              >
                {watchCategory === 'personal' ? (
                  isCreating ? 'Creating...' : 'Create Goal'
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBackStep}
                disabled={isCreating}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={handleSkipMembers}
                  disabled={isCreating}
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Skip
                </Button>
                <Button 
                  type="button" 
                  onClick={handleCreateGoal}
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Goal'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
