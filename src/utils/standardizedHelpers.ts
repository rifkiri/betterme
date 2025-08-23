// Standardized helper functions for consistent UI behavior

/**
 * Get standard card variant based on state
 */
export const getContentCardVariant = (
  isOverdue: boolean, 
  isCompleted: boolean, 
  isWarning?: boolean
): "default" | "success" | "danger" | "warning" => {
  if (isOverdue) return "danger";
  if (isCompleted) return "success";
  if (isWarning) return "warning";
  return "default";
};

/**
 * Get standard status badge variant based on progress and state
 */
export const getStatusBadgeStatus = (
  progress: number,
  isOverdue: boolean,
  isCompleted?: boolean
): "completed" | "overdue" | "inProgress" | "high" | "medium" | "low" => {
  if (isCompleted || progress === 100) return "completed";
  if (isOverdue) return "overdue";
  return "inProgress";
};

/**
 * Get priority-based status badge variant
 */
export const getPriorityBadgeStatus = (priority: string): "high" | "medium" | "low" => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return "high";
    case 'medium':
      return "medium";
    case 'low':
    default:
      return "low";
  }
};

/**
 * Standard progress calculation with bounds checking
 */
export const calculateProgressChange = (
  currentProgress: number,
  change: number,
  min: number = 0,
  max: number = 100
): number => {
  return Math.max(min, Math.min(max, currentProgress + change));
};

/**
 * Format count for badges (handles pluralization)
 */
export const formatCountDisplay = (count: number, singular: string, plural?: string): string => {
  const pluralForm = plural || `${singular}s`;
  return `${count} ${count === 1 ? singular : pluralForm}`;
};