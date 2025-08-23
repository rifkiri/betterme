import * as React from "react"
import { Badge } from "./badge"
import { Link } from "lucide-react"
import { cn } from "@/lib/utils"

export interface LinkBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  count?: number;
  variant?: "default" | "success" | "info";
  showIcon?: boolean;
}

const getLinkBadgeClasses = (variant: "default" | "success" | "info" = "default") => {
  switch (variant) {
    case "success":
      return "bg-content-success text-content-success-foreground border-content-success-border";
    case "info":
      return "bg-content-info text-content-info-foreground border-content-info-border";
    default:
      return "bg-content-default text-content-default-foreground border-content-default-border";
  }
};

const LinkBadge = React.forwardRef<HTMLDivElement, LinkBadgeProps>(
  ({ className, children, count, variant = "default", showIcon = true, ...props }, ref) => {
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-xs flex items-center gap-1",
          getLinkBadgeClasses(variant),
          className
        )}
        {...props}
      >
        {showIcon && <Link className="h-2 w-2" />}
        {children}
        {count !== undefined && count > 1 && (
          <span>({count})</span>
        )}
      </Badge>
    )
  }
)
LinkBadge.displayName = "LinkBadge"

export { LinkBadge }