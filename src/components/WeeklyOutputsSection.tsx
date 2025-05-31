import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Trash2, CalendarIcon } from 'lucide-react';
import { DeletedWeeklyOutputsDialog } from './DeletedWeeklyOutputsDialog';
import { AddWeeklyOutputDialog } from './AddWeeklyOutputDialog';
import { EditWeeklyOutputDialog } from './EditWeeklyOutputDialog';
import { WeeklyOutput } from '@/types/productivity';
import { format, isToday, isTomorrow } from 'date-fns';

interface WeeklyOutputsSectionProps {
  weeklyOutputs: WeeklyOutput[];
  deletedWeeklyOutputs: WeeklyOutput[];
  onAddWeeklyOutput: (output: Omit<WeeklyOutput, 'id' | 'createdDate'>) => void;
  onEditWeeklyOutput: (id: string, updates: Partial<WeeklyOutput>) => void;
  onUpdateProgress: (outputId: string, newProgress: number) => void;
  onDeleteWeeklyOutput: (id: string) => void;
  onRestoreWeeklyOutput: (id: string) => void;
  onPermanentlyDeleteWeeklyOutput: (id: string) => void;
}

export const WeeklyOutputsSection = ({
  weeklyOutputs,
  deletedWeeklyOutputs,
  onAddWeeklyOutput,
  onEditWeeklyOutput,
  onUpdateProgress,
  onDeleteWeeklyOutput,
  onRestoreWeeklyOutput,
  onPermanentlyDeleteWeeklyOutput,
}: WeeklyOutputsSectionProps) => {
  const [editingOutput, setEditingOutput] = useState<WeeklyOutput | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            This Week's Outputs
          </CardTitle>
          <CardDescription>Key deliverables and goals for the week</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <DeletedWeeklyOutputsDialog
            deletedWeeklyOutputs={deletedWeeklyOutputs}
            onRestore={onRestoreWeeklyOutput}
            onPermanentlyDelete={onPermanentlyDeleteWeeklyOutput}
          />
          <AddWeeklyOutputDialog onAddWeeklyOutput={onAddWeeklyOutput} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {weeklyOutputs.map((output) => (
            <div key={output.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div 
                    className="cursor-pointer hover:bg-blue-100 rounded p-1 -m-1 transition-colors"
                    onClick={() => setEditingOutput(output)}
                  >
                    <p className="text-sm text-gray-700 leading-relaxed mb-2">{output.title}</p>
                  </div>
                  {output.dueDate && (
                    <div className="flex items-center text-xs text-gray-500">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      <span>
                        Due: {isToday(output.dueDate) ? 'Today' : isTomorrow(output.dueDate) ? 'Tomorrow' : format(output.dueDate, 'MMM dd')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={output.progress === 100 ? 'default' : 'secondary'} 
                    className="text-xs"
                  >
                    {output.progress}%
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeleteWeeklyOutput(output.id)}
                    className="text-xs px-2 py-1 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="mb-3">
                <Progress 
                  value={output.progress} 
                  className="h-2"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateProgress(output.id, output.progress - 10)}
                  disabled={output.progress <= 0}
                  className="text-xs px-2 py-1"
                >
                  -10%
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateProgress(output.id, output.progress + 10)}
                  disabled={output.progress >= 100}
                  className="text-xs px-2 py-1"
                >
                  +10%
                </Button>
                {output.progress !== 100 && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onUpdateProgress(output.id, 100)}
                    className="text-xs px-2 py-1"
                  >
                    Complete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      
      {editingOutput && (
        <EditWeeklyOutputDialog
          weeklyOutput={editingOutput}
          open={true}
          onOpenChange={(open) => !open && setEditingOutput(null)}
          onSave={onEditWeeklyOutput}
        />
      )}
    </Card>
  );
};
