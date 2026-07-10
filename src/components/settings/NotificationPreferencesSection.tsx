import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bell, BellRing, Clock, UserPlus, Shield, PlusCircle } from 'lucide-react';
import { useNotificationPreferences, NotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';
import { toast } from 'sonner';

const toggles: Array<{
  key: keyof NotificationPreferences;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    key: 'notify_new_task',
    label: 'New tasks',
    description: 'Notify me when a new task is created',
    Icon: PlusCircle,
  },
  {
    key: 'notify_deadline_1hr',
    label: 'Deadline reminders',
    description: 'Notify me 1 hour before a deadline',
    Icon: Clock,
  },
  {
    key: 'notify_team_added',
    label: 'Team assignments',
    description: "Notify me when I'm added to a new team or task",
    Icon: UserPlus,
  },
  {
    key: 'notify_role_updates',
    label: 'Role updates',
    description: 'Notify me when my role or permissions change',
    Icon: Shield,
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
    const n = notify('Test notification', {
      body: 'Nice! Browser notifications are working.',
    });
    if (n) toast.success('Test notification sent');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Control which browser notifications you receive while the app is open.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
          <div className="flex items-start gap-3">
            <BellRing className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Browser permission</p>
              <p className="text-xs text-muted-foreground">
                {!isSupported && 'Not supported in this browser.'}
                {isSupported && permission === 'granted' && 'Notifications are enabled.'}
                {isSupported && permission === 'denied' && 'Blocked — enable in your browser site settings.'}
                {isSupported && permission === 'default' && 'Permission not requested yet.'}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={handleTest} disabled={!isSupported}>
            Test notification
          </Button>
        </div>

        <div className="space-y-4">
          {toggles.map(({ key, label, description, Icon }, idx) => (
            <React.Fragment key={key}>
              {idx > 0 && <Separator />}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor={key}>{label}</Label>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
                <Switch
                  id={key}
                  checked={preferences[key]}
                  disabled={isLoading}
                  onCheckedChange={(v) => updatePreference(key, v)}
                />
              </div>
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
