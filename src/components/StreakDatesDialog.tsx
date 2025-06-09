
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface StreakDatesDialogProps {
  habitId: string;
  habitName: string;
  streak: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CompletionDate {
  completed_date: string;
}

export const StreakDatesDialog = ({ 
  habitId, 
  habitName, 
  streak, 
  open, 
  onOpenChange 
}: StreakDatesDialogProps) => {
  const [streakDates, setStreakDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && streak > 0) {
      fetchStreakDates();
    }
  }, [open, habitId, streak]);

  const fetchStreakDates = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the last 'streak' number of days to find completion dates
      const endDate = new Date();
      const startDate = subDays(endDate, streak + 5); // Get a few extra days to be safe

      const { data, error } = await supabase
        .from('habit_completions')
        .select('completed_date')
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .gte('completed_date', format(startDate, 'yyyy-MM-dd'))
        .lte('completed_date', format(endDate, 'yyyy-MM-dd'))
        .order('completed_date', { ascending: false });

      if (error) {
        console.error('Error fetching streak dates:', error);
        return;
      }

      // Calculate consecutive days from today backwards
      const dates: Date[] = [];
      let currentDate = new Date(); // Start from today
      
      for (let i = 0; i < streak; i++) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const hasCompletion = data?.some((completion: CompletionDate) => 
          completion.completed_date === dateStr
        );
        
        if (hasCompletion) {
          dates.push(new Date(currentDate));
        } else {
          break; // Break if we find a gap in the streak
        }
        
        currentDate = subDays(currentDate, 1);
      }

      setStreakDates(dates.reverse()); // Show oldest to newest
    } catch (error) {
      console.error('Error fetching streak dates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {habitName} Streak
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <Badge variant="default" className="text-lg px-4 py-2">
              {streak} day streak
            </Badge>
          </div>
          
          {isLoading ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Loading streak dates...</p>
            </div>
          ) : streakDates.length > 0 ? (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Completion dates:</h4>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                {streakDates.map((date, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200"
                  >
                    <span className="text-sm font-medium">
                      {format(date, 'MMM d, yyyy')}
                    </span>
                    <span className="text-xs text-green-600">
                      {format(date, 'EEEE')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">No streak dates found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
