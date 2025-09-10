import React, { useState, useEffect } from 'react';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PomodoroSessionSettings } from '@/hooks/usePomodoroSessionManager';
import { FieldWrapper } from '@/components/ui/field-wrapper';

interface PomodoroSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: PomodoroSessionSettings;
  onSave: (settings: PomodoroSessionSettings) => void;
}

export const PomodoroSettings: React.FC<PomodoroSettingsProps> = ({
  open,
  onOpenChange,
  settings,
  onSave,
}) => {
  const [formData, setFormData] = useState<PomodoroSessionSettings>(settings);

  // Sync form data with settings prop changes
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // Reset form data when dialog opens to ensure fresh state
  useEffect(() => {
    if (open) {
      setFormData(settings);
    }
  }, [open, settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Pomodoro Settings"
      description="Customize your Pomodoro timer preferences"
      onSubmit={handleSubmit}
      submitText="Save Settings"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FieldWrapper label="Work Duration (minutes)">
            <Input
              type="number"
              min="1"
              max="60"
              value={formData.workDuration}
              onChange={(e) => setFormData({ ...formData, workDuration: parseInt(e.target.value) || 25 })}
            />
          </FieldWrapper>

          <FieldWrapper label="Short Break (minutes)">
            <Input
              type="number"
              min="1"
              max="30"
              value={formData.shortBreakDuration}
              onChange={(e) => setFormData({ ...formData, shortBreakDuration: parseInt(e.target.value) || 5 })}
            />
          </FieldWrapper>

          <FieldWrapper label="Long Break (minutes)">
            <Input
              type="number"
              min="1"
              max="60"
              value={formData.longBreakDuration}
              onChange={(e) => setFormData({ ...formData, longBreakDuration: parseInt(e.target.value) || 15 })}
            />
          </FieldWrapper>

          <FieldWrapper label="Sessions Until Long Break">
            <Input
              type="number"
              min="2"
              max="8"
              value={formData.sessionsUntilLongBreak}
              onChange={(e) => setFormData({ ...formData, sessionsUntilLongBreak: parseInt(e.target.value) || 4 })}
            />
          </FieldWrapper>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-enabled">Sound Notifications</Label>
            <Switch
              id="sound-enabled"
              checked={formData.soundEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, soundEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notifications-enabled">Browser Notifications</Label>
            <Switch
              id="notifications-enabled"
              checked={formData.notificationsEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, notificationsEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-start-breaks">Auto-start Breaks</Label>
            <Switch
              id="auto-start-breaks"
              checked={formData.autoStartBreaks}
              onCheckedChange={(checked) => setFormData({ ...formData, autoStartBreaks: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-start-work">Auto-start Work Sessions</Label>
            <Switch
              id="auto-start-work"
              checked={formData.autoStartWork}
              onCheckedChange={(checked) => setFormData({ ...formData, autoStartWork: checked })}
            />
          </div>
        </div>
      </div>
    </FormDialog>
  );
};