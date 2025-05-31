
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Plus } from 'lucide-react';

interface WeeklyOutput {
  id: string;
  title: string;
  progress: number;
}

export const WeeklyOutputsSection = () => {
  const [weeklyOutputs, setWeeklyOutputs] = useState<WeeklyOutput[]>([
    { id: '1', title: "Complete Q4 project proposal and presentation", progress: 75 },
    { id: '2', title: "Finish client onboarding documentation", progress: 40 },
    { id: '3', title: "Conduct 3 team performance reviews", progress: 100 },
    { id: '4', title: "Launch marketing campaign for new product feature", progress: 20 }
  ]);

  const updateProgress = (outputId: string, newProgress: number) => {
    setWeeklyOutputs(prev => prev.map(output => 
      output.id === outputId ? { ...output, progress: Math.max(0, Math.min(100, newProgress)) } : output
    ));
  };

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
                <Badge 
                  variant={output.progress === 100 ? 'default' : 'secondary'} 
                  className="ml-2 text-xs"
                >
                  {output.progress}%
                </Badge>
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
                  onClick={() => updateProgress(output.id, output.progress - 10)}
                  disabled={output.progress <= 0}
                  className="text-xs px-2 py-1"
                >
                  -10%
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateProgress(output.id, output.progress + 10)}
                  disabled={output.progress >= 100}
                  className="text-xs px-2 py-1"
                >
                  +10%
                </Button>
                {output.progress !== 100 && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => updateProgress(output.id, 100)}
                    className="text-xs px-2 py-1"
                  >
                    Complete
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full mt-3">
            <Plus className="h-4 w-4 mr-2" />
            Add Weekly Output
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
