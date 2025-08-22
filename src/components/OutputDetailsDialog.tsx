import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Calendar, 
  Edit, 
  Plus, 
  Minus, 
  CheckCircle2,
  Link,
  Target,
  ArrowUp
} from 'lucide-react';
import { WeeklyOutput, Task, Goal } from '@/types/productivity';
import { format } from 'date-fns';
import { useState } from 'react';
import { EditWeeklyOutputDialog } from './EditWeeklyOutputDialog';

interface OutputDetailsDialogProps {
  output: WeeklyOutput;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditWeeklyOutput: (id: string, updates: Partial<WeeklyOutput>) => Promise<void>;
  onUpdateProgress: (outputId: string, newProgress: number) => void;
  goals: Goal[];
  tasks: Task[];
  onUpdateLinks?: (outputId: string, goalIds: string[]) => void;
}

export const OutputDetailsDialog = ({
  output,
  open,
  onOpenChange,
  onEditWeeklyOutput,
  onUpdateProgress,
  goals,
  tasks,
  onUpdateLinks
}: OutputDetailsDialogProps) => {
  const [editingOutput, setEditingOutput] = useState<WeeklyOutput | null>(null);

  // Find the linked goal using the simple linkedGoalId field
  const linkedGoal = output.linkedGoalId ? goals.find(g => g.id === output.linkedGoalId) : null;

  const linkedTasks = tasks.filter(task => 
    task.weeklyOutputId === output.id
  );

  const completedTasks = linkedTasks.filter(task => task.completed).length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Output Details
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Output Overview */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900">{output.title}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={output.progress === 100 ? 'default' : 'secondary'} className="text-xs">
                    {output.progress}%
                  </Badge>
                  {output.progress === 100 && (
                    <Badge className="text-xs bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
              </div>

              {output.description && (
                <p className="text-sm text-gray-600">{output.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="font-medium">{format(output.createdDate, 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="font-medium">{format(output.dueDate, 'MMM dd, yyyy')}</p>
                </div>
              </div>

              {output.isMoved && output.originalDueDate && (
                <div className="p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                  <p className="text-orange-800">
                    Moved from: {format(output.originalDueDate, 'MMM dd, yyyy')}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Progress value={output.progress} className="h-3" />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateProgress(output.id, Math.max(0, output.progress - 10))}
                    disabled={output.progress <= 0}
                    className="text-xs px-3"
                  >
                    <Minus className="h-3 w-3 mr-1" />
                    -10%
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateProgress(output.id, Math.min(100, output.progress + 10))}
                    disabled={output.progress >= 100}
                    className="text-xs px-3"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    +10%
                  </Button>
                  {output.progress !== 100 && (
                    <Button
                      size="sm"
                      onClick={() => onUpdateProgress(output.id, 100)}
                      className="text-xs px-3"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Contributing Goals */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <ArrowUp className="h-4 w-4 text-indigo-600" />
                  Contributing to Goals ({linkedGoal ? 1 : 0})
                </h4>
              </div>
              
              {!linkedGoal ? (
                <p className="text-sm text-gray-500 py-2">This output is not linked to any goals</p>
              ) : (
                <div className="space-y-2">
                  {(() => {
                    const goal = linkedGoal;
const getCategoryColor = (category: Goal['category']) => {
                      switch (category) {
                        case 'work': return 'bg-blue-100 text-blue-800';
                        case 'personal': return 'bg-green-100 text-green-800';
                        default: return 'bg-gray-100 text-gray-800';
                      }
                    };

                    return (
                      <div key={goal.id} className="p-3 border rounded-lg bg-white">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium text-sm">{goal.title}</h5>
                              <Badge className={`text-xs ${getCategoryColor(goal.category)}`}>
                                {goal.category}
                              </Badge>
                            </div>
                            {goal.description && (
                              <p className="text-xs text-gray-600 mt-1">{goal.description}</p>
                            )}
                          </div>
                          <Badge variant={goal.progress === 100 ? 'default' : 'secondary'} className="text-xs">
                            {goal.progress}%
                          </Badge>
                        </div>
                        <Progress value={goal.progress} className="h-2 mb-2" />
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Progress: {goal.progress}%</span>
                          {goal.deadline && (
                            <span>Due: {format(goal.deadline, 'MMM dd')}</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Linked Tasks */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Link className="h-4 w-4 text-green-600" />
                Linked Tasks ({linkedTasks.length})
              </h4>
              
              {linkedTasks.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">No tasks linked to this output</p>
              ) : (
                <div className="space-y-2">
                  {linkedTasks.map((task) => (
                    <div key={task.id} className="p-3 border rounded-lg bg-white">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {format(task.dueDate, 'MMM dd')}</span>
                            {task.estimatedTime && (
                              <span>• {task.estimatedTime}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            task.completed ? 'default' : 
                            task.priority === 'high' || task.priority === 'urgent' ? 'destructive' :
                            task.priority === 'medium' ? 'secondary' : 'outline'
                          } className="text-xs">
                            {task.priority}
                          </Badge>
                          {task.completed && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Task Summary */}
            {linkedTasks.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium text-sm text-green-900 mb-2">Task Completion Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-green-700">Total Tasks</p>
                    <p className="font-medium text-green-900">{linkedTasks.length}</p>
                  </div>
                  <div>
                    <p className="text-green-700">Completed</p>
                    <p className="font-medium text-green-900">{completedTasks}</p>
                  </div>
                  <div>
                    <p className="text-green-700">Remaining</p>
                    <p className="font-medium text-green-900">{linkedTasks.length - completedTasks}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <Progress value={(completedTasks / linkedTasks.length) * 100} className="h-2" />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => setEditingOutput(output)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Output
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {editingOutput && (
        <EditWeeklyOutputDialog 
          weeklyOutput={editingOutput} 
          open={true} 
          onOpenChange={open => {
            if (!open) {
              setEditingOutput(null);
            }
          }} 
          onSave={onEditWeeklyOutput}
          goals={goals}
        />
      )}
    </>
  );
};