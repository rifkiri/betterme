import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trash2, RotateCcw, Archive } from 'lucide-react';
import { Goal } from '@/types/productivity';
import { format } from 'date-fns';
import { ListDialog } from '@/components/ui/standardized';

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
  const [open, setOpen] = useState(false);
  
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

  const renderGoalItem = (goal: Goal) => (
    <>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{goal.title}</h4>
          {goal.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{goal.description}</p>
          )}
        </div>
        <Badge className={getCategoryColor(goal.category)}>
          {goal.category}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Progress value={goal.progress} className="flex-1" />
          <span className="text-sm text-gray-600">{goal.progress}%</span>
        </div>
        
        {goal.deadline && (
          <p className="text-sm text-gray-600">
            Deadline: {format(new Date(goal.deadline), 'MMM d, yyyy')}
          </p>
        )}
      </div>
      
      <div className="flex gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onRestore(goal.id);
            setOpen(false);
          }}
          className="flex-1"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Restore
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            onPermanentlyDelete(goal.id);
            if (deletedGoals.length === 1) {
              setOpen(false);
            }
          }}
          className="flex-1"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete Forever
        </Button>
      </div>
    </>
  );

  return (
    <ListDialog
      open={open}
      onOpenChange={setOpen}
      title={`Deleted Goals (${deletedGoals.length})`}
      items={deletedGoals}
      renderItem={renderGoalItem}
      triggerIcon={<Archive className="h-3 w-3 sm:h-4 sm:w-4" />}
      triggerText="Deleted"
      emptyMessage="No deleted goals"
      scrollHeight="80"
    />
  );
};