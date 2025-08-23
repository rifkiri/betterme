import * as React from "react"
import { cn } from "@/lib/utils"

export interface DashboardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  responsive?: boolean;
}

const getGridClasses = (columns: number, responsive: boolean) => {
  if (!responsive) {
    return `grid-cols-${columns}`;
  }
  
  switch (columns) {
    case 2:
      return "grid-cols-1 md:grid-cols-2";
    case 3:
      return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    case 4:
      return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
    default:
      return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
  }
};

const getGapClass = (gap: string) => {
  switch (gap) {
    case "sm": return "gap-4";
    case "lg": return "gap-8";
    default: return "gap-6";
  }
};

const DashboardGrid = React.forwardRef<HTMLDivElement, DashboardGridProps>(
  ({ 
    className,
    children,
    columns = 3,
    gap = "md",
    responsive = true,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          getGridClasses(columns, responsive),
          getGapClass(gap),
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DashboardGrid.displayName = "DashboardGrid"

export { DashboardGrid }