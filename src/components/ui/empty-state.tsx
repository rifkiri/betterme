import * as React from "react"
import { LucideIcon } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  size?: "sm" | "md" | "lg";
}

const getSizeClasses = (size: string) => {
  switch (size) {
    case "sm":
      return {
        container: "py-8",
        icon: "h-8 w-8",
        title: "text-lg",
        description: "text-sm"
      };
    case "lg":
      return {
        container: "py-16",
        icon: "h-16 w-16",
        title: "text-2xl",
        description: "text-base"
      };
    default:
      return {
        container: "py-12",
        icon: "h-12 w-12",
        title: "text-xl",
        description: "text-sm"
      };
  }
};

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ 
    className,
    icon: Icon,
    title,
    description,
    action,
    size = "md",
    ...props 
  }, ref) => {
    const sizeClasses = getSizeClasses(size);
    
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center",
          sizeClasses.container,
          className
        )}
        {...props}
      >
        {Icon && (
          <div className="mb-4 rounded-full bg-content-default p-4">
            <Icon className={cn(sizeClasses.icon, "text-content-default-foreground")} />
          </div>
        )}
        
        <h3 className={cn("font-semibold text-foreground mb-2", sizeClasses.title)}>
          {title}
        </h3>
        
        {description && (
          <p className={cn("text-muted-foreground mb-6 max-w-sm", sizeClasses.description)}>
            {description}
          </p>
        )}
        
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || "default"}
          >
            {action.label}
          </Button>
        )}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

export { EmptyState }