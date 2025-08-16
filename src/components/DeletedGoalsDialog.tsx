import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trash2, RotateCcw, Archive } from 'lucide-react';
import { Goal } from '@/types/productivity';
import { format } from 'date-fns';

interface DeletedGoalsDialogProps {
  deletedGoals: Goal[];
  onRestore: (id: string) => void;
  onPermanentlyDelete: (id: string) => void;
}

export const DeletedGoalsDialog = ({ 
  deletedGoals, 
  onRestore, 
  onPermanentlyDelete 
}: DeletedGoalsDialogProps) => {
const getCategoryColor = (category: Goal['category']) => {
    switch (category) {
      case 'work': return 'bg-blue-100 text-blue-800';
      case 'personal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (deletedGoals.length === 0) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 text-xs sm:text-sm h-8 sm:h-9">
          <Archive className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Deleted ({deletedGoals.length})</span>
          <span className="sm:hidden">({deletedGoals.length})</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Deleted Goals ({deletedGoals.length})</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-3">
          {deletedGoals.map((goal) => (
            <div key={goal.id} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm truncate">{goal.title}</h3>
                    <Badge className={`text-xs shrink-0 ${getCategoryColor(goal.category)}`}>
                      {goal.category}
                    </Badge>
                  </div>
                  {goal.description && (
                    <p className="text-xs text-gray-600 mb-2">{goal.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Target: {goal.targetValue} {goal.unit}</span>
                    <span>Progress: {goal.currentValue}/{goal.targetValue}</span>
                    {goal.deadline && (
                      <span>Deadline: {format(goal.deadline, 'MMM dd, yyyy')}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRestore(goal.id)}
                    className="h-7 px-2 gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span className="text-xs">Restore</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onPermanentlyDelete(goal.id)}
                    className="h-7 px-2 gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span className="text-xs">Delete</span>
                  </Button>
                </div>
              </div>
              
              <div className="mb-2">
                <Progress value={goal.progress} className="h-2" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => {}}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};