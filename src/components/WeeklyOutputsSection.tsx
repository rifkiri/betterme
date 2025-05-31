
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Plus, Trash2 } from 'lucide-react';
import { DeletedWeeklyOutputsDialog } from './DeletedWeeklyOutputsDialog';

interface WeeklyOutputsSectionProps {
  weeklyOutputs: any[];
  deletedWeeklyOutputs: any[];
  onUpdateProgress: (outputId: string, newProgress: number) => void;
  onDeleteWeeklyOutput: (id: string) => void;
  onRestoreWeeklyOutput: (id: string) => void;
  onPermanentlyDeleteWeeklyOutput: (id: string) => void;
}

export const WeeklyOutputsSection = ({
  weeklyOutputs,
  deletedWeeklyOutputs,
  onUpdateProgress,
  onDeleteWeeklyOutput,
  onRestoreWeeklyOutput,
  onPermanentlyDeleteWeeklyOutput,
}: WeeklyOutputsSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            This Week's Outputs
          </CardTitle>
          <CardDescription>Key deliverables and goals for the week</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {weeklyOutputs.map((output) => (
            <div key={output.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm text-gray-700 leading-relaxed flex-1">{output.title}</p>
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
          <div className="flex justify-between items-center mt-3">
            <Button size="sm" variant="outline" className="flex-1 mr-2">
              <Plus className="h-4 w-4 mr-2" />
              Add Weekly Output
            </Button>
            {deletedWeeklyOutputs.length > 0 && (
              <DeletedWeeklyOutputsDialog
                deletedWeeklyOutputs={deletedWeeklyOutputs}
                onRestore={onRestoreWeeklyOutput}
                onPermanentlyDelete={onPermanentlyDeleteWeeklyOutput}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
