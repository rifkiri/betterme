import * as React from "react";
import { cn } from "@/lib/utils";

export interface DashboardLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  backgroundGradient?: "default" | "blue-green" | "purple-pink" | "orange-yellow" | "none";
  maxWidth?: "7xl" | "6xl" | "5xl" | "full";
  padding?: "default" | "compact" | "spacious";
  className?: string;
}

const gradientClasses = {
  default: "bg-gradient-to-br from-background-gradient-from via-background to-background-gradient-to",
  "blue-green": "bg-gradient-to-br from-blue-50 via-white to-green-50",
  "purple-pink": "bg-gradient-to-br from-purple-50 via-white to-pink-50",
  "orange-yellow": "bg-gradient-to-br from-orange-50 via-white to-yellow-50",
  none: "bg-background"
};

const maxWidthClasses = {
  "7xl": "max-w-7xl",
  "6xl": "max-w-6xl",
  "5xl": "max-w-5xl",
  full: "max-w-full"
};

const paddingClasses = {
  default: "p-2 sm:p-4",
  compact: "p-1 sm:p-2",
  spacious: "p-4 sm:p-6"
};

/**
 * Standardized dashboard layout component with consistent header, gradient backgrounds, and spacing
 * Used across Monthly, Team, Admin, and other dashboard pages
 */
export const DashboardLayout = ({
  children,
  header,
  title,
  subtitle,
  headerActions,
  backgroundGradient = "default",
  maxWidth = "7xl",
  padding = "default",
  className
}: DashboardLayoutProps) => {
  return (
    <div className={cn(
      "min-h-screen",
      gradientClasses[backgroundGradient],
      paddingClasses[padding],
      className
    )}>
      <div className={cn(maxWidthClasses[maxWidth], "mx-auto space-y-4")}>
        {/* Standardized header section */}
        {(header || title) && (
          <div className="mb-6">
            {header || (
              <div className="flex items-start justify-between">
                <div>
                  {title && (
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-muted-foreground">{subtitle}</p>
                  )}
                </div>
                {headerActions && (
                  <div className="flex items-center gap-2">
                    {headerActions}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Main content */}
        {children}
      </div>
    </div>
  );
};