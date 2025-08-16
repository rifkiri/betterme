import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'lucide-react';
import { Goal } from '@/types/productivity';
import { format } from 'date-fns';

interface LinkGoalsDialogProps {
  outputId: string;
  linkedGoalIds: string[];
  availableGoals: Goal[];
  onUpdateLinks: (outputId: string, goalIds: string[]) => void;
}

export const LinkGoalsDialog = ({
  outputId,
  linkedGoalIds,
  availableGoals,
  onUpdateLinks
}: LinkGoalsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>(linkedGoalIds);

  const handleSave = () => {
    onUpdateLinks(outputId, selectedGoalIds);
    setOpen(false);
  };

  const handleGoalToggle = (goalId: string, checked: boolean) => {
    if (checked) {
      setSelectedGoalIds(prev => [...prev, goalId]);
    } else {
      setSelectedGoalIds(prev => prev.filter(id => id !== goalId));
    }
  };

const getCategoryColor = (category: Goal['category']) => {
    switch (category) {
      case 'work': return 'bg-blue-100 text-blue-800';
      case 'personal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 text-xs">
          <Link className="h-3 w-3" />
          Link Goals ({linkedGoalIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Link Goals to Output</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-3">
          {availableGoals.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No goals available to link</p>
          ) : (
            availableGoals.map((goal) => {
              const isSelected = selectedGoalIds.includes(goal.id);
              const isLinked = linkedGoalIds.includes(goal.id);
              
              return (
                <div 
                  key={goal.id} 
                  className={`border rounded-lg p-3 transition-colors ${
                    isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleGoalToggle(goal.id, !!checked)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium text-sm ${goal.completed ? 'line-through text-gray-500' : ''}`}>
                          {goal.title}
                        </h3>
                        <Badge className={`text-xs ${getCategoryColor(goal.category)}`}>
                          {goal.category}
                        </Badge>
                        {goal.completed && (
                          <Badge variant="secondary" className="text-xs">
                            Completed
                          </Badge>
                        )}
                        {isLinked && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                            Currently Linked
                          </Badge>
                        )}
                      </div>
                      {goal.description && (
                        <p className="text-xs text-gray-600 mb-2">{goal.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Progress: {goal.progress}%</span>
                        {goal.deadline && (
                          <span>Due: {format(goal.deadline, 'MMM dd, yyyy')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-sm text-gray-600">
            {selectedGoalIds.length} goal{selectedGoalIds.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Update Links
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};