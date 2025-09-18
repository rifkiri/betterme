import { Badge } from "@/components/ui/badge";
import { Globe, Shield, User } from "lucide-react";
import { GoalVisibility } from "./GoalVisibilitySelector";

interface GoalVisibilityBadgeProps {
  visibility: GoalVisibility;
  className?: string;
}

const visibilityConfig = {
  all: {
    label: 'All',
    icon: Globe,
    variant: 'secondary' as const,
  },
  managers: {
    label: 'Managers',
    icon: Shield,
    variant: 'outline' as const,
  },
  self: {
    label: 'Private',
    icon: User,
    variant: 'outline' as const,
  },
};

export function GoalVisibilityBadge({ visibility, className }: GoalVisibilityBadgeProps) {
  const config = visibilityConfig[visibility];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}