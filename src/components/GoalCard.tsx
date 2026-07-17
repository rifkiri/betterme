import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarIcon, Trash2, Link, Eye, Minus, Plus, CheckCircle, Target, RefreshCw, Cloud, CloudOff, Trophy, XCircle, Calculator } from 'lucide-react';
import { Goal, Task, WeeklyOutput, GoalAssignment } from '@/types/productivity';
import { format, isToday, isTomorrow, formatDistanceToNow } from 'date-fns';
import { EditGoalDialog } from './EditGoalDialog';
import { PersonalGoalEditDialog } from './PersonalGoalEditDialog';
import { MoveGoalDialog } from './MoveGoalDialog';
import { GoalDetailsDialog } from './GoalDetailsDialog';
import { mapSubcategoryDatabaseToDisplay } from '@/utils/goalCategoryUtils';
import { ContentCard } from '@/components/ui/content-card';
import { IconButton } from '@/components/ui/icon-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LinkBadge } from '@/components/ui/link-badge';
import { ProgressControls } from '@/components/ui/progress-controls';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { DateDisplay } from '@/components/ui/date-display';
import { getContentCardVariant, getStatusBadgeStatus, formatCountDisplay } from '@/utils/standardizedHelpers';
import { useAuth } from '@/contexts/AuthContext';
import { VisibilityBadge } from '@/components/ui/visibility-badge';
import { CardMetaStrip } from '@/components/ui/card-meta-strip';
import { AssignmentRole } from '@/components/ui/role-styles';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ResourceLinksQuickButton } from './ResourceLinksQuickButton';

interface GoalCardProps {
  goal: Goal;
  tasks?: Task[];
  weeklyOutputs?: WeeklyOutput[];
  onEditGoal: (id: string, updates: Partial<Goal>) => void;
  onUpdateProgress: (goalId: string, newProgress: number) => void;
  onMoveGoal: (id: string, newDeadline: Date) => void;
  onDeleteGoal: (id: string) => void;
  isOverdue?: boolean;
  isCompleted?: boolean;
  onRefresh?: () => Promise<void>;
  assignments?: GoalAssignment[];
  availableUsers?: any[];
  onSyncToZatzet?: (goalId: string, progress: number) => Promise<void>;
  isSyncing?: boolean;
}

export const GoalCard = ({
  goal,
  tasks = [],
  weeklyOutputs = [],
  onEditGoal,
  onUpdateProgress,
  onMoveGoal,
  onDeleteGoal,
  isOverdue = false,
  isCompleted = false,
  onRefresh,
  assignments = [],
  availableUsers = [],
  onSyncToZatzet,
  isSyncing = false
}: GoalCardProps) => {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { user } = useAuth();
  
  // Check if user can update progress
  const isGoalOwner = goal.userId === user?.id;
  const currentUserAssignment = assignments?.find(a => a.userId === user?.id && a.goalId === goal.id);
  const isAssignedToGoal = !!currentUserAssignment;
  const canUpdateProgress = isGoalOwner || isAssignedToGoal;
  const currentUserRole = currentUserAssignment?.role as AssignmentRole | undefined;
  
  // Check if this is an OKR goal from Zatzet
  const isOkrGoal = goal.subcategory === 'okr';
  
  const getCategoryColor = (category: Goal['category']) => {
    switch (category) {
      case 'work': return 'bg-blue-100 text-blue-800';
      case 'personal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate linked outputs using the restored linkedGoalId field  
  const linkedOutputs = weeklyOutputs?.filter(output => output.linkedGoalId === goal.id) || [];
  const linkedOutputsCount = linkedOutputs.length;

  // Format last sync time
  const getLastSyncDisplay = () => {
    if (!goal.lastExternalSyncAt) return null;
    try {
      return formatDistanceToNow(new Date(goal.lastExternalSyncAt), { addSuffix: true });
    } catch {
      return null;
    }
  };

  const lastSyncDisplay = getLastSyncDisplay();

  const isWeighted = goal.progressCalculation === 'weighted';
  const isWon = goal.category === 'work' && goal.subcategory === 'sales' && goal.tenderOutcome === 'won';
  const isLost = goal.category === 'work' && goal.subcategory === 'sales' && goal.tenderOutcome === 'lost';
  const outcomeBorderClass = isWon
    ? 'ring-2 ring-green-500 border-green-500 bg-green-50/40'
    : isLost
      ? 'ring-2 ring-red-500 border-red-500 bg-red-50/40'
      : '';

  return (
    <>
      <div className={`rounded-lg ${outcomeBorderClass}`}>
      <ContentCard variant={getContentCardVariant(isOverdue, isCompleted)}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="cursor-pointer hover:bg-primary/5 rounded-md p-2 -m-2 transition-all duration-200" onClick={() => setShowDetailsDialog(true)}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-base font-semibold text-foreground leading-relaxed flex-1 tracking-tight">{goal.title}</p>
                <div className="flex items-center gap-1 flex-wrap">
                  <Badge className={`text-xs ${getCategoryColor(goal.category)}`}>
                    {goal.category}
                  </Badge>
                  
                  {isOkrGoal ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="text-xs bg-purple-100 text-purple-800 border border-purple-300 cursor-help">
                            <Target className="w-3 h-3 mr-1" />
                            OKR
                            {isSyncing ? (
                              <RefreshCw className="w-3 h-3 ml-1 animate-spin" />
                            ) : lastSyncDisplay ? (
                              <Cloud className="w-3 h-3 ml-1 text-green-600" />
                            ) : (
                              <CloudOff className="w-3 h-3 ml-1 text-gray-400" />
                            )}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {isSyncing 
                              ? 'Syncing with Zatzet OKR...' 
                              : lastSyncDisplay 
                                ? `Last synced ${lastSyncDisplay}` 
                                : 'Not synced yet'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : goal.subcategory && (
                    <Badge variant="outline" className="text-xs bg-white border-gray-300">
                      {mapSubcategoryDatabaseToDisplay(goal.subcategory)}
                    </Badge>
                  )}
                </div>
              </div>
              {goal.description && (
                <p className="text-xs text-gray-600 mb-2">{goal.description}</p>
              )}
              {/* OKR Hierarchy Display */}
              {isOkrGoal && (goal.externalObjectiveTitle || goal.externalKeyResultTitle) && (
                <div className="space-y-0.5 mb-2 text-xs">
                  {goal.externalObjectiveTitle && (
                    <div className="flex items-center gap-1 text-purple-600">
                      <span className="font-medium">OBJ:</span>
                      <span className="truncate">{goal.externalObjectiveTitle}</span>
                    </div>
                  )}
                  {goal.externalKeyResultTitle && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <span className="font-medium">KR:</span>
                      <span className="truncate">{goal.externalKeyResultTitle}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <CardMetaStrip
              ownerId={goal.userId}
              role={currentUserRole}
              visibility={goal.visibility}
              className="mb-2"
            />
            <div className="flex items-center gap-2 mb-2">
              {linkedOutputsCount > 0 && (
                <LinkBadge variant="success">
                  {formatCountDisplay(linkedOutputsCount, "output")} linked
                </LinkBadge>
              )}
              <span className="text-xs text-gray-500 flex items-center gap-1">
                Progress: {goal.progress}%
                {isWeighted && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Calculator className="h-3 w-3 text-blue-600" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Progress calculated automatically based on weighted child items.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {isWon && (
                  <Badge className="ml-1 bg-green-600 text-white text-[10px] py-0 px-1"><Trophy className="h-3 w-3 mr-0.5" />WON</Badge>
                )}
                {isLost && (
                  <Badge className="ml-1 bg-red-600 text-white text-[10px] py-0 px-1"><XCircle className="h-3 w-3 mr-0.5" />LOST</Badge>
                )}
              </span>
              <ResourceLinksQuickButton
                entityType="goal"
                entityId={goal.id}
                collaboratorIds={[goal.userId ?? '', ...assignments.filter(a => a.goalId === goal.id).map(a => a.userId)].filter(Boolean)}
              />
            </div>
            {goal.deadline && (
              <DateDisplay 
                date={goal.deadline}
                isOverdue={isOverdue}
                prefix="Due:"
              />
            )}
          </div>
          <div className="flex items-center space-x-2">
            <StatusBadge 
              status={getStatusBadgeStatus(goal.progress, isOverdue, isCompleted)}
            >
              {goal.progress}%
            </StatusBadge>
            <ActionButtonGroup
              onView={() => setShowDetailsDialog(true)}
              onDelete={() => onDeleteGoal(goal.id)}
              customActions={
                <MoveGoalDialog 
                  onMoveGoal={newDeadline => onMoveGoal(goal.id, newDeadline)} 
                  disabled={goal.progress === 100} 
                />
              }
            />
          </div>
        </div>
        
        <div className="mb-3">
          <Progress value={goal.progress} className={`h-2 ${isOverdue ? 'bg-red-100' : ''}`} />
        </div>

        {/* Tender Win/Loss controls for sales goals */}
        {goal.category === 'work' && goal.subcategory === 'sales' && (
          <div className="mb-3 space-y-2 border-t pt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 font-medium">Tender:</span>
              {(['won', 'lost', 'pending'] as const).map((outcome) => {
                const active = (goal.tenderOutcome ?? 'pending') === outcome;
                const styles = active
                  ? outcome === 'won' ? 'bg-green-600 text-white hover:bg-green-700'
                  : outcome === 'lost' ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
                  : 'bg-white';
                const Icon = outcome === 'won' ? Trophy : outcome === 'lost' ? XCircle : Minus;
                return (
                  <Button
                    key={outcome}
                    size="sm"
                    variant={active ? 'default' : 'outline'}
                    className={`h-7 px-2 text-xs capitalize ${styles}`}
                    onClick={() => onEditGoal(goal.id, { tenderOutcome: outcome } as Partial<Goal>)}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {outcome}
                  </Button>
                );
              })}
            </div>
            <Input
              defaultValue={goal.tenderOutcomeNote || ''}
              placeholder="Add note…"
              className="h-8 text-xs"
              onBlur={(e) => {
                const val = e.target.value;
                if (val !== (goal.tenderOutcomeNote || '')) {
                  onEditGoal(goal.id, { tenderOutcomeNote: val } as Partial<Goal>);
                }
              }}
            />
          </div>
        )}

        {canUpdateProgress && (
          <ProgressControls
            progress={goal.progress}
            onDecrease={() => onUpdateProgress(goal.id, Math.max(0, goal.progress - 10))}
            onIncrease={() => onUpdateProgress(goal.id, Math.min(100, goal.progress + 10))}
            onComplete={() => onUpdateProgress(goal.id, 100)}
            step={10}
          />
        )}
      </ContentCard>
      </div>

      
      <GoalDetailsDialog
        goal={goal}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        onEditGoal={onEditGoal}
        onUpdateProgress={onUpdateProgress}
        weeklyOutputs={weeklyOutputs}
        tasks={tasks}
        onRefresh={onRefresh}
        assignments={assignments}
        availableUsers={availableUsers}
      />
    </>
  );
};