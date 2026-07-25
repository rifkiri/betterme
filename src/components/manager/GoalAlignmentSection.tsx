import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Deterministic team-member highlight palette
const MEMBER_PALETTE = [
  { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', ring: 'ring-blue-400', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', ring: 'ring-emerald-400', dot: 'bg-emerald-500' },
  { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', ring: 'ring-purple-400', dot: 'bg-purple-500' },
  { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', ring: 'ring-amber-400', dot: 'bg-amber-500' },
  { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300', ring: 'ring-rose-400', dot: 'bg-rose-500' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300', ring: 'ring-indigo-400', dot: 'bg-indigo-500' },
  { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300', ring: 'ring-teal-400', dot: 'bg-teal-500' },
  { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300', ring: 'ring-pink-400', dot: 'bg-pink-500' },
];
const memberPalette = (userId: string) => {
  if (!userId) return MEMBER_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  return MEMBER_PALETTE[hash % MEMBER_PALETTE.length];
};
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  Calendar as CalendarIcon,
  User as UserIcon,
  Users,
  Search,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Plus,
  FileText,
} from 'lucide-react';
import { format, addDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Goal, WeeklyOutput } from '@/types/productivity';
import { AddWeeklyOutputDialog } from '@/components/AddWeeklyOutputDialog';
import { useProductivity } from '@/hooks/useProductivity';

interface Assignment { userId: string; role: string; }
interface ProfileLite { id: string; name: string; email: string; role: string; }

interface EnrichedOutput extends WeeklyOutput {
  ownerName: string;
  isUpcomingInNext2Weeks: boolean;
}
interface EnrichedGoal extends Goal {
  ownerName: string;
  assignedMembers: Array<{ userId: string; name: string; role: string }>;
  linkedOutputs: EnrichedOutput[];
  upcomingBiweeklyOutputs: EnrichedOutput[];
  alignmentStatus: 'aligned' | 'unaligned' | 'completed';
}

export const GoalAlignmentSection: React.FC = () => {
  const { addWeeklyOutput } = useProductivity();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [weeklyOutputs, setWeeklyOutputs] = useState<WeeklyOutput[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileLite>>(new Map());
  const [assignmentsMap, setAssignmentsMap] = useState<Map<string, Assignment[]>>(new Map());
  const [fetching, setFetching] = useState(true);

  const [selectedPic, setSelectedPic] = useState<string>('all');
  const [alignmentFilter, setAlignmentFilter] = useState<'all' | 'aligned' | 'unaligned' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'work' | 'personal'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'goals' | 'pic'>('goals');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showCompletedGoals, setShowCompletedGoals] = useState(false);

  const loadAlignmentData = async () => {
    setFetching(true);
    try {
      const [profilesRes, goalsRes, assignRes, outputsRes] = await Promise.all([
        supabase.from('profiles').select('id,name,email,role'),
        supabase.from('goals').select('*').eq('is_deleted', false).order('created_date', { ascending: false }),
        supabase.from('goal_assignments').select('goal_id,user_id,role'),
        supabase.from('weekly_outputs').select('*').eq('is_deleted', false).order('due_date', { ascending: true }),
      ]);

      const pMap = new Map<string, ProfileLite>();
      (profilesRes.data || []).forEach((p: any) => {
        pMap.set(p.id, {
          id: p.id,
          name: p.name || p.email || 'Unknown User',
          email: p.email || '',
          role: p.role || 'team-member',
        });
      });
      setProfiles(pMap);

      setGoals(
        (goalsRes.data || []).map((g: any) => ({
          id: g.id,
          userId: g.user_id,
          title: g.title,
          description: g.description,
          category: g.category,
          subcategory: g.subcategory,
          deadline: g.deadline ? new Date(g.deadline) : undefined,
          createdDate: new Date(g.created_date),
          completed: g.completed,
          archived: g.archived,
          progress: g.progress || 0,
          createdBy: g.created_by,
          visibility: g.visibility || 'all',
        })) as Goal[]
      );

      const aMap = new Map<string, Assignment[]>();
      (assignRes.data || []).forEach((a: any) => {
        const existing = aMap.get(a.goal_id) || [];
        existing.push({ userId: a.user_id, role: a.role });
        aMap.set(a.goal_id, existing);
      });
      setAssignmentsMap(aMap);

      setWeeklyOutputs(
        (outputsRes.data || []).map((o: any) => ({
          id: o.id,
          userId: o.user_id,
          title: o.title,
          description: o.description,
          progress: o.progress || 0,
          createdDate: new Date(o.created_date),
          dueDate: o.due_date ? new Date(o.due_date) : new Date(),
          completedDate: o.completed_date ? new Date(o.completed_date) : undefined,
          linkedGoalId: o.linked_goal_id || undefined,
          visibility: o.visibility || 'all',
        })) as WeeklyOutput[]
      );
    } catch (err) {
      console.error('Error loading alignment data:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadAlignmentData();
  }, []);

  const today = startOfDay(new Date());
  const twoWeeksLater = endOfDay(addDays(today, 14));

  const enrichedGoals: EnrichedGoal[] = useMemo(() => {
    return goals.map((goal) => {
      const owner = profiles.get(goal.userId || '');
      const assignments = assignmentsMap.get(goal.id) || [];
      const assignedMembers = assignments.map(a => ({
        userId: a.userId,
        name: profiles.get(a.userId)?.name || 'Unknown',
        role: a.role,
      }));

      const linkedRaw = weeklyOutputs.filter(o => o.linkedGoalId === goal.id);
      const linked: EnrichedOutput[] = linkedRaw.map(o => {
        const oo = profiles.get(o.userId || '');
        const upcoming = o.dueDate ? isWithinInterval(o.dueDate, { start: today, end: twoWeeksLater }) : false;
        return { ...o, ownerName: oo?.name || 'Unknown', isUpcomingInNext2Weeks: upcoming };
      });

      const upcoming = linked.filter(o => o.isUpcomingInNext2Weeks && o.progress < 100);

      let status: 'aligned' | 'unaligned' | 'completed' = 'unaligned';
      if (goal.completed || goal.progress >= 100) status = 'completed';
      else if (upcoming.length > 0) status = 'aligned';

      return {
        ...goal,
        ownerName: owner?.name || 'Unknown Owner',
        assignedMembers,
        linkedOutputs: linked,
        upcomingBiweeklyOutputs: upcoming,
        alignmentStatus: status,
      };
    });
  }, [goals, profiles, assignmentsMap, weeklyOutputs]);

  const allPicList = useMemo(
    () => Array.from(profiles.values()).sort((a, b) => a.name.localeCompare(b.name)),
    [profiles]
  );

  const filteredGoals = useMemo(() => {
    return enrichedGoals.filter(goal => {
      if (!showCompletedGoals && goal.alignmentStatus === 'completed') return false;
      if (selectedPic !== 'all') {
        const isOwner = goal.userId === selectedPic;
        const isAssigned = goal.assignedMembers.some(m => m.userId === selectedPic);
        const isOutputOwner = goal.linkedOutputs.some(o => o.userId === selectedPic);
        if (!isOwner && !isAssigned && !isOutputOwner) return false;
      }
      if (alignmentFilter !== 'all' && goal.alignmentStatus !== alignmentFilter) return false;
      if (categoryFilter !== 'all' && goal.category !== categoryFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const inTitle = goal.title.toLowerCase().includes(q);
        const inOwner = goal.ownerName.toLowerCase().includes(q);
        const inOutputs = goal.linkedOutputs.some(o => o.title.toLowerCase().includes(q));
        if (!inTitle && !inOwner && !inOutputs) return false;
      }
      return true;
    });
  }, [enrichedGoals, selectedPic, alignmentFilter, categoryFilter, searchQuery, showCompletedGoals]);

  const activeCount = enrichedGoals.filter(g => g.alignmentStatus !== 'completed').length;
  const alignedCount = enrichedGoals.filter(g => g.alignmentStatus === 'aligned').length;
  const unalignedCount = enrichedGoals.filter(g => g.alignmentStatus === 'unaligned').length;
  const completedCount = enrichedGoals.filter(g => g.alignmentStatus === 'completed').length;
  const alignmentRate = activeCount > 0 ? Math.round((alignedCount / activeCount) * 100) : 100;

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statusBadge = (s: EnrichedGoal['alignmentStatus']) => {
    if (s === 'aligned') return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">🟢 Scheduled for Next 2 Weeks</Badge>;
    if (s === 'completed') return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">🔵 Goal Completed</Badge>;
    return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">⚠️ Missing Output for Next 2 Weeks</Badge>;
  };

  // PIC view aggregation
  const picGroups = useMemo(() => {
    const map = new Map<string, { profile: ProfileLite; goals: EnrichedGoal[]; outputs: EnrichedOutput[] }>();
    filteredGoals.forEach(goal => {
      const involved = new Set<string>();
      if (goal.userId) involved.add(goal.userId);
      goal.assignedMembers.forEach(m => involved.add(m.userId));
      goal.linkedOutputs.forEach(o => o.userId && involved.add(o.userId));
      involved.forEach(uid => {
        const p = profiles.get(uid);
        if (!p) return;
        const entry = map.get(uid) || { profile: p, goals: [], outputs: [] };
        entry.goals.push(goal);
        goal.linkedOutputs.filter(o => o.userId === uid).forEach(o => entry.outputs.push(o));
        map.set(uid, entry);
      });
    });
    return Array.from(map.values()).sort((a, b) => a.profile.name.localeCompare(b.profile.name));
  }, [filteredGoals, profiles]);

  return (
    <div className="space-y-4">
      {/* Overview banner */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Sparkles className="h-5 w-5 text-primary" /> Goal & Biweekly Output Alignment
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Verify every active goal has scheduled outputs for the next 2 weeks ({format(today, 'MMM dd')} – {format(twoWeeksLater, 'MMM dd, yyyy')}).
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Alignment Rate</p>
              <p className="text-3xl font-bold text-primary">{alignmentRate}%</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCell label="Active Goals" value={activeCount} icon={<Target className="h-4 w-4" />} />
            <StatCell label="Aligned" value={alignedCount} icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} />
            <StatCell label="Missing 2-Wk Output" value={unalignedCount} icon={<AlertTriangle className="h-4 w-4 text-orange-600" />} />
            <StatCell label="Completed" value={completedCount} icon={<CheckCircle2 className="h-4 w-4 text-blue-600" />} />
          </div>
        </CardContent>
      </Card>

      {/* Filter toolbar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search goal, owner, output…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>

            <Select value={selectedPic} onValueChange={setSelectedPic}>
              <SelectTrigger className="w-[180px] h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">All Persons In Charge</SelectItem>
                {allPicList.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={alignmentFilter} onValueChange={(v: any) => setAlignmentFilter(v)}>
              <SelectTrigger className="w-[190px] h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="aligned">🟢 Aligned</SelectItem>
                <SelectItem value="unaligned">⚠️ Missing 2-Wk Output</SelectItem>
                <SelectItem value="completed">🔵 Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={(v: any) => setCategoryFilter(v)}>
              <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
              <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="goals">By Goal</SelectItem>
                <SelectItem value="pic">By PIC</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 pl-2 border-l ml-1">
              <Switch id="show-completed-goals" checked={showCompletedGoals} onCheckedChange={setShowCompletedGoals} />
              <Label htmlFor="show-completed-goals" className="text-xs cursor-pointer">Include Completed Goals</Label>
            </div>
          </div>

          {/* Team Members Highlight Palette */}
          {allPicList.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Team Members</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedPic('all')}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition ${selectedPic === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                >
                  All
                </button>
                {allPicList.map(p => {
                  const pal = memberPalette(p.id);
                  const active = selectedPic === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPic(active ? 'all' : p.id)}
                      className={`text-[11px] px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${pal.bg} ${pal.text} ${pal.border} ${active ? `ring-2 ${pal.ring}` : ''}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${pal.dot}`} />
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {fetching ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading alignment data…</CardContent></Card>
      ) : viewMode === 'goals' ? (
        <div className="space-y-2">
          {filteredGoals.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No goals match the current filters.</CardContent></Card>
          ) : filteredGoals.map(goal => (
            <Card key={goal.id}>
              <CardContent className="p-3 sm:p-4">
                <Collapsible open={expanded.has(goal.id)} onOpenChange={() => toggleExpand(goal.id)}>
                  <div className="flex items-start gap-3">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 mt-0.5">
                        {expanded.has(goal.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{goal.title}</h3>
                        {statusBadge(goal.alignmentStatus)}
                        <Badge variant="outline" className="text-[10px]">{goal.category}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        {(() => { const pal = memberPalette(goal.userId || ''); return (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${pal.bg} ${pal.text} ${pal.border}`}>
                            <UserIcon className="h-3 w-3" /> {goal.ownerName}
                          </span>
                        ); })()}
                        {goal.deadline && (
                          <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {format(goal.deadline, 'MMM dd, yyyy')}</span>
                        )}
                        <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {goal.linkedOutputs.length} outputs ({goal.upcomingBiweeklyOutputs.length} upcoming)</span>
                        {goal.assignedMembers.length > 0 && (
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {goal.assignedMembers.length}</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={goal.progress} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-10 text-right">{goal.progress}%</span>
                      </div>
                    </div>
                  </div>

                  <CollapsibleContent className="mt-3 pl-9">
                    {goal.assignedMembers.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Team</p>
                        <div className="flex flex-wrap gap-1">
                          {goal.assignedMembers.map(m => {
                            const pal = memberPalette(m.userId);
                            return (
                              <Badge key={m.userId} variant="outline" className={`text-[10px] ${pal.bg} ${pal.text} ${pal.border}`}>
                                {m.name} · {m.role}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-muted-foreground">Linked Outputs</p>
                      <AddWeeklyOutputTrigger goal={goal} onAdd={async (o) => { await addWeeklyOutput(o); await loadAlignmentData(); }} />
                    </div>
                    {goal.linkedOutputs.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No linked outputs yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {goal.linkedOutputs.map(o => (
                          <div key={o.id} className="flex items-center gap-2 text-xs border rounded p-2">
                            <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="flex-1 truncate">{o.title}</span>
                            <span className="text-muted-foreground">{o.ownerName}</span>
                            {o.dueDate && <span className="text-muted-foreground">{format(o.dueDate, 'MMM dd')}</span>}
                            {o.isUpcomingInNext2Weeks && <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[9px]">2-wk</Badge>}
                            <span className="w-10 text-right">{o.progress}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {picGroups.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No people match the current filters.</CardContent></Card>
          ) : picGroups.map(group => {
            const active = group.goals.filter(g => g.alignmentStatus !== 'completed').length;
            const aligned = group.goals.filter(g => g.alignmentStatus === 'aligned').length;
            const rate = active > 0 ? Math.round((aligned / active) * 100) : 100;
            return (
              <Card key={group.profile.id} className={`border-l-4 ${memberPalette(group.profile.id).border.replace('border-', 'border-l-')}`}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {(() => { const pal = memberPalette(group.profile.id); return (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${pal.bg} ${pal.text} ${pal.border}`}>
                          <span className={`h-2 w-2 rounded-full ${pal.dot}`} />
                          <span className="font-semibold text-sm">{group.profile.name}</span>
                        </span>
                      ); })()}
                      <Badge variant="outline" className="text-[10px]">{group.profile.role}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {aligned}/{active} aligned · <span className="font-semibold text-primary">{rate}%</span> · {group.outputs.length} outputs
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {group.goals.map(g => (
                      <div key={g.id} className="flex items-center gap-2 text-xs border rounded p-2">
                        <Target className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="flex-1 truncate">{g.title}</span>
                        {statusBadge(g.alignmentStatus)}
                        <span className="w-10 text-right text-muted-foreground">{g.progress}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

const StatCell: React.FC<{ label: string; value: number; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="border rounded-lg p-3">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon} {label}</div>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

const AddWeeklyOutputTrigger: React.FC<{ goal: EnrichedGoal; onAdd: (o: Omit<WeeklyOutput, 'id' | 'createdDate'>) => Promise<void> }> = ({ goal, onAdd }) => {
  // Reuse existing dialog but pre-scope to this goal via availableGoals list
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground hidden sm:inline">Schedule 2-week output</span>
      <AddWeeklyOutputDialog onAddWeeklyOutput={onAdd} availableGoals={[goal]} />
    </div>
  );
};
