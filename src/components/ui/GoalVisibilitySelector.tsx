import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Shield, User } from "lucide-react";
import { Label } from "@/components/ui/label";

export type GoalVisibility = 'all' | 'managers' | 'self';

interface GoalVisibilitySelectorProps {
  value: GoalVisibility;
  onChange: (value: GoalVisibility) => void;
  disabled?: boolean;
}

const visibilityOptions = [
  {
    value: 'all' as GoalVisibility,
    label: 'Visible to All',
    description: 'Everyone in the team can see this goal',
    icon: Globe,
  },
  {
    value: 'managers' as GoalVisibility,
    label: 'Managers Only',
    description: 'Only managers and admins can see this goal',
    icon: Shield,
  },
  {
    value: 'self' as GoalVisibility,
    label: 'Private',
    description: 'Only you can see this goal',
    icon: User,
  },
];

export function GoalVisibilitySelector({ value, onChange, disabled }: GoalVisibilitySelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Visibility</Label>
      <Select value={value} onValueChange={(v) => onChange(v as GoalVisibility)} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Select visibility" />
        </SelectTrigger>
        <SelectContent>
          {visibilityOptions.map((option) => {
            const Icon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-start gap-2">
                  <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}