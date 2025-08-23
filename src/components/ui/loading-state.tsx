import * as React from "react"
import { Loader2, LucideIcon } from "lucide-react"
import { Skeleton } from "./skeleton"
import { cn } from "@/lib/utils"

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "spinner" | "skeleton" | "pulse";
  size?: "sm" | "md" | "lg";
  message?: string;
  icon?: LucideIcon;
  rows?: number;
}

const getSizeClasses = (size: string, variant: string) => {
  switch (size) {
    case "sm":
      return {
        spinner: "h-4 w-4",
        container: "py-4",
        text: "text-sm"
      };
    case "lg":
      return {
        spinner: "h-8 w-8",
        container: "py-12",
        text: "text-lg"
      };
    default:
      return {
        spinner: "h-6 w-6",
        container: "py-8",
        text: "text-base"
      };
  }
};

const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ 
    className,
    variant = "spinner",
    size = "md",
    message = "Loading...",
    icon: Icon,
    rows = 3,
    ...props 
  }, ref) => {
    const sizeClasses = getSizeClasses(size, variant);
    
    if (variant === "skeleton") {
      return (
        <div
          ref={ref}
          className={cn("space-y-3", sizeClasses.container, className)}
          {...props}
        >
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      );
    }
    
    if (variant === "pulse") {
      return (
        <div
          ref={ref}
          className={cn(
            "rounded-lg bg-content-default animate-pulse",
            sizeClasses.container,
            className
          )}
          {...props}
        >
          <div className="h-32 w-full" />
        </div>
      );
    }
    
    // Default spinner variant
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
        <div className="mb-3">
          {Icon ? (
            <Icon className={cn(sizeClasses.spinner, "animate-pulse text-muted-foreground")} />
          ) : (
            <Loader2 className={cn(sizeClasses.spinner, "animate-spin text-muted-foreground")} />
          )}
        </div>
        {message && (
          <p className={cn("text-muted-foreground", sizeClasses.text)}>
            {message}
          </p>
        )}
      </div>
    )
  }
)
LoadingState.displayName = "LoadingState"

export { LoadingState }