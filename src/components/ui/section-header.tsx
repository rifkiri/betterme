import * as React from "react"
import { CardHeader, CardTitle, CardDescription } from "./card"
import { cn } from "@/lib/utils"

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  layout?: "default" | "compact" | "spacious";
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ 
    className,
    title,
    description,
    icon,
    actions,
    layout = "default",
    ...props 
  }, ref) => {
    const spacing = layout === "compact" ? "space-y-2" : layout === "spacious" ? "space-y-6" : "space-y-4";
    
    return (
      <CardHeader 
        ref={ref}
        className={cn(spacing, className)}
        {...props}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </CardHeader>
    )
  }
)
SectionHeader.displayName = "SectionHeader"

export { SectionHeader }