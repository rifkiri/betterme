import { useState } from 'react';
import { Trash2, RotateCcw, Archive } from 'lucide-react';
import { Goal } from '@/types/productivity';
import { format } from 'date-fns';
import { ListDialog, IconButton, StatusBadge } from '@/components/ui/standardized';
import { Badge } from '@/components/ui/badge';

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

  // Keep button visible even when empty for consistency

  const renderGoalItem = (goal: Goal) => (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{goal.title}</h4>
          <Badge className={getCategoryColor(goal.category)}>
            {goal.category}
          </Badge>
        </div>
        {goal.deadline && (
          <p className="text-sm text-muted-foreground mt-1">
            Deadline: {format(new Date(goal.deadline), 'MMM d, yyyy')}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <IconButton
          icon={<RotateCcw className="h-4 w-4" />}
          tooltip="Restore goal"
          colorScheme="success"
          onClick={() => {
            onRestore(goal.id);
            setOpen(false);
          }}
        />
        <IconButton
          icon={<Trash2 className="h-4 w-4" />}
          tooltip="Delete forever"
          colorScheme="destructive"
          onClick={() => {
            onPermanentlyDelete(goal.id);
            if (deletedGoals.length === 1) {
              setOpen(false);
            }
          }}
        />
      </div>
    </div>
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