import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Calendar, 
  Edit, 
  Plus, 
  Minus, 
  CheckCircle2,
  Link,
  Clock,
  ArrowRight,
  Users,
  Settings
} from 'lucide-react';
import { Goal, Task, WeeklyOutput, Habit, GoalAssignment } from '@/types/productivity';
import { format, isBefore } from 'date-fns';
import { useState, useEffect } from 'react';
import { EditGoalDialog } from './EditGoalDialog';
import { PersonalGoalEditDialog } from './PersonalGoalEditDialog';
import { useHabits } from '@/hooks/useHabits';
import { mapSubcategoryDatabaseToDisplay } from '@/utils/goalCategoryUtils';

interface GoalDetailsDialogProps {
  goal: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditGoal: (id: string, updates: Partial<Goal>) => void;
  onUpdateProgress: (goalId: string, newProgress: number) => void;
  weeklyOutputs: WeeklyOutput[];
  tasks: Task[];
  habits?: Habit[];
  currentUserId?: string;
  onRefresh?: () => Promise<void>;
  assignments?: GoalAssignment[];
  availableUsers?: any[];
}

export const GoalDetailsDialog = ({
  goal,
  open,
  onOpenChange,
  onEditGoal,
  onUpdateProgress,
  weeklyOutputs,
  tasks,
  habits = [],
  currentUserId,
  onRefresh,
  assignments = [],
  availableUsers = []
}: GoalDetailsDialogProps) => {
  const [editingGoal, setEditingGoal] = useState(false);
  const [linkedOutputs, setLinkedOutputs] = useState<WeeklyOutput[]>([]);
  const [linkedHabits, setLinkedHabits] = useState<Habit[]>([]);
  const [loadingLinkedOutputs, setLoadingLinkedOutputs] = useState(false);
  const [loadingLinkedHabits, setLoadingLinkedHabits] = useState(false);
  
  // Get habits data for personal goals
  const { habits: allHabits } = useHabits();

  useEffect(() => {
    const fetchLinkedItems = async () => {
      if (open) {
        setLoadingLinkedOutputs(true);
        if (goal.category === 'personal') {
          setLoadingLinkedHabits(true);
        }
        
        // Find outputs linked to this goal using the restored linkedGoalId field
        const goalLinkedOutputs = weeklyOutputs.filter(output => output.linkedGoalId === goal.id);
        setLinkedOutputs(goalLinkedOutputs);
        
        setLoadingLinkedOutputs(false);
        
        // Find habits linked to this goal for personal goals
        if (goal.category === 'personal') {
          const goalLinkedHabits = (habits.length > 0 ? habits : allHabits).filter(habit => habit.linkedGoalId === goal.id);
          setLinkedHabits(goalLinkedHabits);
          setLoadingLinkedHabits(false);
        }
      }
    };

    fetchLinkedItems();
  }, [goal.id, goal.category, currentUserId, open, weeklyOutputs, habits, allHabits]);

  // Debug logging for assignments
  useEffect(() => {
    if (open && goal.category === 'work') {
      console.log('🎯 [GOAL DETAILS] Assignment Debug:', {
        goalId: goal.id,
        totalAssignments: assignments.length,
        goalAssignments: assignments.filter(a => a.goalId === goal.id),
        availableUsersCount: availableUsers.length,
        assignments: assignments,
        availableUsers: availableUsers
      });
    }
  }, [open, goal.id, goal.category, assignments, availableUsers]);

const getCategoryColor = (category: Goal['category']) => {
    switch (category) {
      case 'work': return 'bg-blue-100 text-blue-800';
      case 'personal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  const relatedTasks = tasks.filter(task => 
    linkedOutputs.some(output => output.id === task.weeklyOutputId)
  );

  const isOverdue = goal.deadline && isBefore(goal.deadline, new Date()) && goal.progress < 100;
  
  // Check user permissions for different types of editing
  const isGoalCreator = currentUserId && (goal.createdBy === currentUserId || goal.userId === currentUserId);
  const userAssignment = assignments.find(a => a.goalId === goal.id && a.userId === currentUserId);
  const hasAssignmentRole = userAssignment?.role;
  const canFullEdit = isGoalCreator;
  const canEditLinkagesAndRoles = hasAssignmentRole || isGoalCreator;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600" />
              Goal Details
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Goal Overview */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${getCategoryColor(goal.category)}`}>
                    {goal.category}
                  </Badge>
                  {goal.subcategory && (
                    <Badge variant="outline" className="text-xs bg-white border-gray-300">
                      {mapSubcategoryDatabaseToDisplay(goal.subcategory)}
                    </Badge>
                  )}
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  )}
                  {goal.progress === 100 && (
                    <Badge className="text-xs bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Progress</p>
                  <p className="font-medium">{goal.progress}%</p>
                </div>
              </div>

              {goal.deadline && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Deadline: {format(goal.deadline, 'PPP')}</span>
                </div>
              )}

              <div className="space-y-2">
                <Progress value={goal.progress} className="h-3" />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateProgress(goal.id, Math.max(0, goal.progress - 10))}
                    disabled={goal.progress <= 0}
                    className="h-8 w-8 p-0"
                    title="Decrease Progress"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateProgress(goal.id, Math.min(100, goal.progress + 10))}
                    disabled={goal.progress >= 100}
                    className="h-8 w-8 p-0"
                    title="Increase Progress"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  {goal.progress !== 100 && (
                    <Button
                      size="sm"
                      onClick={() => onUpdateProgress(goal.id, 100)}
                      className="h-8 w-8 p-0"
                      title="Mark as Complete"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Linked Outputs */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Link className="h-4 w-4 text-blue-600" />
                Linked Outputs ({linkedOutputs.length})
              </h4>
              
              {loadingLinkedOutputs ? (
                <p className="text-sm text-gray-500 py-2">Loading linked outputs...</p>
              ) : linkedOutputs.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">No outputs linked to this goal</p>
              ) : (
                <div className="space-y-2">
                  {linkedOutputs.map((output) => (
                    <div key={output.id} className="p-3 border rounded-lg bg-white">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">{output.title}</h5>
                          {output.description && (
                            <p className="text-xs text-gray-600 mt-1">{output.description}</p>
                          )}
                        </div>
                        <Badge variant={output.progress === 100 ? 'default' : 'secondary'} className="text-xs">
                          {output.progress}%
                        </Badge>
                      </div>
                      <Progress value={output.progress} className="h-2 mb-2" />
                      {output.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          Due: {format(output.dueDate, 'MMM dd')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linked Habits (Personal Goals Only) */}
            {goal.category === 'personal' && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  Linked Habits ({linkedHabits.length})
                </h4>
                
                {loadingLinkedHabits ? (
                  <p className="text-sm text-gray-500 py-2">Loading linked habits...</p>
                ) : linkedHabits.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">No habits linked to this goal</p>
                ) : (
                  <div className="space-y-2">
                    {linkedHabits.map((habit) => (
                      <div key={habit.id} className="p-3 border rounded-lg bg-white">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{habit.name}</h5>
                            {habit.description && (
                              <p className="text-xs text-gray-600 mt-1">{habit.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={habit.completed ? 'default' : 'secondary'} className="text-xs">
                              {habit.completed ? 'Done Today' : 'Pending'}
                            </Badge>
                            {habit.streak > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {habit.streak} day streak
                              </Badge>
                            )}
                          </div>
                        </div>
                        {habit.category && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span>Category: {habit.category}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Related Tasks */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-green-600" />
                Related Tasks ({relatedTasks.length})
              </h4>
              
              {relatedTasks.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">No tasks related to this goal's outputs</p>
              ) : (
                <div className="space-y-2">
                  {relatedTasks.slice(0, 5).map((task) => {
                    const linkedOutput = linkedOutputs.find(output => output.id === task.weeklyOutputId);
                    return (
                      <div key={task.id} className="p-2 border rounded bg-white">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1">
                            <p className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {task.title}
                            </p>
                            {linkedOutput && (
                              <p className="text-xs text-blue-600">via {linkedOutput.title}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              task.completed ? 'default' : 
                              task.priority === 'High' ? 'destructive' :
                              task.priority === 'Medium' ? 'secondary' : 'outline'
                            } className="text-xs">
                              {task.priority}
                            </Badge>
                            {task.completed && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {relatedTasks.length > 5 && (
                    <p className="text-xs text-gray-500 text-center py-1">
                      +{relatedTasks.length - 5} more tasks
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Team Assignments (Work Goals Only) */}
            {goal.category === 'work' && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  Team Assignments ({assignments.filter(a => a.goalId === goal.id).length})
                  <span className="text-xs text-gray-500">
                    (Total: {assignments.length}, Users: {availableUsers.length})
                  </span>
                </h4>
                
                {assignments.filter(a => a.goalId === goal.id).length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">No team members assigned to this goal</p>
                ) : (
                  <div className="space-y-2">
                    {assignments
                      .filter(a => a.goalId === goal.id)
                      .map((assignment) => {
                        const user = availableUsers.find(u => u.id === assignment.userId);
                        return (
                          <div key={assignment.id} className="p-3 border rounded-lg bg-white">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="font-medium text-sm">{user?.name || 'Unknown User'}</p>
                                  <p className="text-xs text-gray-500">{user?.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={
                                    assignment.role === 'coach' ? 'default' :
                                    assignment.role === 'lead' ? 'secondary' : 'outline'
                                  } 
                                  className="text-xs"
                                >
                                  {assignment.role.charAt(0).toUpperCase() + assignment.role.slice(1)}
                                </Badge>
                                {assignment.selfAssigned && (
                                  <Badge variant="outline" className="text-xs">
                                    Self-assigned
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* Impact Summary */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm text-blue-900 mb-2">Impact Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Connected Outputs</p>
                  <p className="font-medium text-blue-900">{linkedOutputs.length}</p>
                </div>
                <div>
                  <p className="text-blue-700">Related Tasks</p>
                  <p className="font-medium text-blue-900">{relatedTasks.length}</p>
                </div>
                {goal.category === 'personal' && (
                  <>
                    <div>
                      <p className="text-blue-700">Linked Habits</p>
                      <p className="font-medium text-blue-900">{linkedHabits.length}</p>
                    </div>
                    <div>
                      <p className="text-blue-700">Active Streaks</p>
                      <p className="font-medium text-blue-900">
                        {linkedHabits.filter(h => h.streak > 0).length}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-2">
                <p className="text-blue-700 text-xs">
                  {goal.category === 'personal' 
                    ? 'Completing linked outputs and maintaining habits will contribute to this goal\'s progress'
                    : 'Completing linked outputs will contribute to this goal\'s progress'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <div className="flex gap-2">
              {canEditLinkagesAndRoles && !canFullEdit && (
                <Button variant="outline" onClick={() => setEditingGoal(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Links & Roles
                </Button>
              )}
              {canFullEdit && (
                <Button onClick={() => setEditingGoal(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Goal
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {editingGoal && goal.category === 'personal' ? (
        <PersonalGoalEditDialog 
          goal={goal} 
          open={true} 
          onOpenChange={(open) => !open && setEditingGoal(false)} 
          onSave={onEditGoal}
          onRefresh={onRefresh}
          weeklyOutputs={weeklyOutputs}
        />
      ) : editingGoal ? (
        <EditGoalDialog 
          goal={goal} 
          open={true} 
          onOpenChange={(open) => !open && setEditingGoal(false)} 
          onSave={onEditGoal}
          onRefresh={onRefresh}
          weeklyOutputs={weeklyOutputs}
          habits={habits.length > 0 ? habits : allHabits}
          assignments={assignments}
          availableUsers={availableUsers}
          allowFullEdit={canFullEdit}
        />
      ) : null}
    </>
  );
};