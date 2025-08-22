import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'lucide-react';
import { Goal } from '@/types/productivity';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface LinkGoalsDialogProps {
  outputId: string;
  availableGoals: Goal[];
  onUpdateLinks: (outputId: string, goalId: string | null) => void;
}

export const LinkGoalsDialog = ({
  outputId,
  availableGoals,
  onUpdateLinks
}: LinkGoalsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useCurrentUser();

  // Load current linkage when dialog opens
  useEffect(() => {
    if (open && currentUser) {
      loadLinkedGoal();
    }
  }, [open, currentUser, outputId]);

  const loadLinkedGoal = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const { data: output, error } = await supabase
        .from('weekly_outputs')
        .select('linked_goal_id')
        .eq('id', outputId)
        .single();
        
      if (error) throw error;
      
      const linkedId = output?.linked_goal_id || null;
      setLinkedGoalId(linkedId);
      setSelectedGoalId(linkedId);
    } catch (error) {
      console.error('Error loading linked goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Update the weekly_output's linked_goal_id
      const { error } = await supabase
        .from('weekly_outputs')
        .update({ linked_goal_id: selectedGoalId })
        .eq('id', outputId);
        
      if (error) throw error;
      
      onUpdateLinks(outputId, selectedGoalId);
      setLinkedGoalId(selectedGoalId);
      setOpen(false);
    } catch (error) {
      console.error('Error updating goal link:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoalToggle = (goalId: string, checked: boolean) => {
    if (checked) {
      setSelectedGoalId(goalId);
    } else {
      setSelectedGoalId(null);
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
        <Button variant="outline" size="sm" className="gap-1 text-xs" disabled={loading}>
          <Link className="h-3 w-3" />
          Link Goal ({linkedGoalId ? '1' : '0'})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Link Goal to Output</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-3">
          {availableGoals.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No active goals available to link</p>
          ) : (
            availableGoals
              .filter(goal => !goal.completed && !goal.archived && goal.progress < 100)
              .map((goal) => {
              const isSelected = selectedGoalId === goal.id;
              const isLinked = linkedGoalId === goal.id;
              
              return (
                <div 
                  key={goal.id} 
                  className={`border rounded-lg p-3 transition-colors ${
                    isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="selectedGoal"
                      checked={isSelected}
                      onChange={(e) => handleGoalToggle(goal.id, e.target.checked)}
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
            {selectedGoalId ? '1 goal selected' : 'No goal selected'}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedGoalId(null)} disabled={loading}>
              Clear Selection
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Updating...' : 'Update Link'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};