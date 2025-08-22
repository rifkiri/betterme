import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { SimpleLinkageService } from '@/services/SimpleLinkageService';

interface LinkGoalsDialogProps {
  goalId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onLinkageChange?: () => void;
}

export const LinkGoalsDialog: React.FC<LinkGoalsDialogProps> = ({ goalId, open, setOpen, onLinkageChange }) => {
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const { userId: currentUserId } = useAuth();

  const handleLinkGoals = async () => {
      try {
        await SimpleLinkageService.createLinkage(
          goalId,
          'goal',
          selectedGoalId,
          'goal',
          currentUserId!
        );
        
        toast.success('Goals linked successfully');
        onLinkageChange?.();
        setOpen(false);
        setSelectedGoalId('');
      } catch (error) {
        console.error('Error linking goals:', error);
        toast.error('Failed to link goals');
      }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {/* The trigger is now handled outside, so this can be null */}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Link to Another Goal</AlertDialogTitle>
          <AlertDialogDescription>
            Enter the ID of the goal you want to link this goal to.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="goalId" className="text-right">
              Goal ID
            </Label>
            <Input
              type="text"
              id="goalId"
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLinkGoals}>Link Goals</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
