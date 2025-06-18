
import { WeeklyOutput, Project } from '@/types/productivity';
import { AddWeeklyOutputDialog } from './AddWeeklyOutputDialog';
import { WeeklyOutputCard } from './WeeklyOutputCard';

interface WeeklyOutputsSectionProps {
  weeklyOutputs: WeeklyOutput[];
  onAddWeeklyOutput: (output: Omit<WeeklyOutput, 'id' | 'createdDate'>) => void;
  onEditOutput: (id: string, updates: Partial<WeeklyOutput>) => void;
  onUpdateProgress: (outputId: string, newProgress: number) => void;
  onDeleteOutput: (id: string) => void;
  projects?: Project[];
}

export const WeeklyOutputsSection = ({
  weeklyOutputs,
  onAddWeeklyOutput,
  onEditOutput,
  onUpdateProgress,
  onDeleteOutput,
  projects = []
}: WeeklyOutputsSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Weekly Outputs</h2>
        <AddWeeklyOutputDialog onAddWeeklyOutput={onAddWeeklyOutput} projects={projects} />
      </div>
      
      <div className="space-y-3">
        {weeklyOutputs.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            No weekly outputs yet. Add your first output to get started!
          </p>
        ) : (
          weeklyOutputs.map((output) => (
            <WeeklyOutputCard
              key={output.id}
              output={output}
              onEditOutput={onEditOutput}
              onUpdateProgress={onUpdateProgress}
              onDeleteOutput={onDeleteOutput}
              projects={projects}
            />
          ))
        )}
      </div>
    </div>
  );
};
