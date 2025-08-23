import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Badge, BadgeProps } from "./badge"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "text-xs",
  {
    variants: {
      status: {
        default: "bg-content-default text-content-default-foreground border-content-default-border",
        success: "bg-content-success text-content-success-foreground border-content-success-border",
        warning: "bg-content-warning text-content-warning-foreground border-content-warning-border", 
        danger: "bg-content-danger text-content-danger-foreground border-content-danger-border",
        info: "bg-content-info text-content-info-foreground border-content-info-border",
        // Progress-specific variants
        completed: "bg-content-success text-content-success-foreground border-content-success-border",
        overdue: "bg-content-danger text-content-danger-foreground border-content-danger-border",
        inProgress: "bg-content-default text-content-default-foreground border-content-default-border",
        // Priority variants  
        high: "bg-content-danger text-content-danger-foreground border-content-danger-border",
        medium: "bg-content-warning text-content-warning-foreground border-content-warning-border",
        low: "bg-content-info text-content-info-foreground border-content-info-border",
      },
      size: {
        sm: "text-xs px-2 py-0.5",
        md: "text-sm px-2.5 py-1",
      }
    },
    defaultVariants: {
      status: "default",
      size: "sm"
    },
  }
)

export interface StatusBadgeProps
  extends Omit<BadgeProps, 'variant'>,
    VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode;
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, status, size, children, ...props }, ref) => {
    return (
      <Badge
        variant="outline"
        className={cn(statusBadgeVariants({ status, size, className }))}
        {...props}
      >
        {children}
      </Badge>
    )
  }
)
StatusBadge.displayName = "StatusBadge"

export { StatusBadge, statusBadgeVariants }