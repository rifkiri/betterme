
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Bell, Mail, Moon, Sun } from 'lucide-react';

export const PreferencesSection = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [emailReminders, setEmailReminders] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5" />
          Preferences
        </CardTitle>
        <CardDescription>
          Customize your application experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-gray-500" />
            <div>
              <Label htmlFor="notifications">Push Notifications</Label>
              <p className="text-sm text-gray-600">Receive notifications for important updates</p>
            </div>
          </div>
          <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-gray-500" />
            <div>
              <Label htmlFor="email-reminders">Email Reminders</Label>
              <p className="text-sm text-gray-600">Get email reminders for deadlines and tasks</p>
            </div>
          </div>
          <Switch id="email-reminders" checked={emailReminders} onCheckedChange={setEmailReminders} />
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon className="h-5 w-5 text-gray-500" /> : <Sun className="h-5 w-5 text-gray-500" />}
            <div>
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <p className="text-sm text-gray-600">Toggle dark/light theme</p>
            </div>
          </div>
          <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
        </div>
      </CardContent>
    </Card>
  );
};
