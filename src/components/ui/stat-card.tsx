import * as React from "react"
import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "./card"
import { cn } from "@/lib/utils"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "gradient" | "success" | "warning" | "danger";
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const getStatCardClasses = (variant: "default" | "gradient" | "success" | "warning" | "danger" = "default") => {
  switch (variant) {
    case "gradient":
      return "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20";
    case "success":
      return "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200";
    case "warning":
      return "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200";
    case "danger":
      return "bg-gradient-to-br from-red-50 to-rose-50 border-red-200";
    default:
      return "bg-card border-border";
  }
};

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ 
    className, 
    title, 
    value, 
    icon: Icon, 
    variant = "default", 
    description,
    trend,
    ...props 
  }, ref) => {
    return (
      <Card 
        ref={ref}
        className={cn(getStatCardClasses(variant), className)}
        {...props}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
              {trend && (
                <div className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {trend.value}
                </div>
              )}
            </div>
            <div className="h-12 w-12 rounded-lg bg-content-default flex items-center justify-center">
              <Icon className="h-6 w-6 text-content-default-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
)
StatCard.displayName = "StatCard"

export { StatCard }