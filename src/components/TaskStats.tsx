
interface TaskStatsProps {
  completedCount: number;
  totalCount: number;
}

export const TaskStats = ({ completedCount, totalCount }: TaskStatsProps) => {
  return (
    <span>{completedCount} of {totalCount} completed</span>
  );
};
