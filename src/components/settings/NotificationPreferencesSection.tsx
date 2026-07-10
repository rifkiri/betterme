import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  BellRing,
  Clock,
  UserPlus,
  Shield,
  PlusCircle,
  Target,
  ListChecks,
  FileText,
  CheckCheck,
  Sunrise,
  AtSign,
} from 'lucide-react';
import { useNotificationPreferences, NotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';
import { toast } from 'sonner';

type ToggleDef = {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const GROUPS: Array<{ title: string; description: string; toggles: ToggleDef[] }> = [
  {
    title: 'Tasks',
    description: 'Alerts about tasks you own or are tagged on.',
    toggles: [
      { key: 'notify_new_task', label: 'New tasks', description: 'A new task is created in your workspace.', Icon: PlusCircle },
      { key: 'notify_task_updates', label: 'Task updates', description: 'A task you own or are tagged on is edited.', Icon: ListChecks },
      { key: 'notify_mention', label: 'Mentions', description: 'Someone @tags you on a task.', Icon: AtSign },
      { key: 'notify_deadline_1hr', label: 'Deadline reminders', description: 'Fires roughly one hour before a due time.', Icon: Clock },
    ],
  },
  {
    title: 'Goals',
    description: 'Alerts about goals you own or collaborate on.',
    toggles: [
      { key: 'notify_goal_updates', label: 'Goal updates', description: 'Progress, deadline, or details change on a goal you belong to.', Icon: Target },
      { key: 'notify_team_added', label: 'New invitations', description: 'You are invited to collaborate on a goal.', Icon: UserPlus },
      { key: 'notify_assignment_response', label: 'Invitation responses', description: 'Someone accepts or declines an invitation you sent.', Icon: CheckCheck },
      { key: 'notify_role_updates', label: 'Role changes', description: 'Your role on a goal (coach / lead / member) changes.', Icon: Shield },
    ],
  },
  {
    title: 'Outputs',
    description: 'Alerts about your weekly and bi-weekly outputs.',
    toggles: [
      { key: 'notify_output_updates', label: 'Output updates', description: 'A weekly or bi-weekly output you own is edited.', Icon: FileText },
    ],
  },
  {
    title: 'Digests',
    description: 'Scheduled summaries so you don\u2019t have to check the app.',
    toggles: [
      { key: 'notify_daily_digest', label: 'Daily digest', description: 'End-of-day summary of what\u2019s due tomorrow.', Icon: Sunrise },
    ],
  },
];

export const NotificationPreferencesSection: React.FC = () => {
  const { preferences, updatePreference, isLoading } = useNotificationPreferences();
  const { permission, requestPermission, notify, isSupported } = useBrowserNotifications(false);

  const handleTest = async () => {
    if (!isSupported) {
      toast.error('Browser notifications are not supported here.');
      return;
    }
    const result = await requestPermission();
    if (result !== 'granted') {
      toast.error('Notification permission was not granted.');
      return;
    }
    const n = notify('BetterMe test notification', {
      body: 'Nice — browser notifications are working.',
    });
    if (n) toast.success('Test notification sent');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose exactly which alerts BetterMe sends. Notifications fire in your browser while the app is open.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4 bg-muted/30">
            <div className="flex items-start gap-3">
              <BellRing className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Browser permission</p>
                <p className="text-xs text-muted-foreground">
                  {!isSupported && 'Not supported in this browser.'}
                  {isSupported && permission === 'granted' && 'Notifications are enabled.'}
                  {isSupported && permission === 'denied' && 'Blocked \u2014 enable in your browser site settings.'}
                  {isSupported && permission === 'default' && 'Permission not requested yet.'}
                </p>
              </div>
            </div>
            <Button size="sm" onClick={handleTest} disabled={!isSupported}>
              Test notification
            </Button>
          </div>
        </CardContent>
      </Card>

      {GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{group.title}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.toggles.map(({ key, label, description, Icon }, idx) => (
              <div key={key} className="space-y-4">
                {idx > 0 && <Separator />}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <Label htmlFor={key} className="cursor-pointer">{label}</Label>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  <Switch
                    id={key}
                    checked={!!preferences[key]}
                    disabled={isLoading}
                    onCheckedChange={(v) => updatePreference(key, v)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
