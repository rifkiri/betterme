import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageContainerProps {
  children: React.ReactNode;
  gradient?: "default" | "blue-green" | "purple-pink" | "orange-yellow" | "none";
  maxWidth?: "7xl" | "6xl" | "5xl" | "full";
  padding?: "default" | "compact" | "spacious";
  className?: string;
}

const gradientClasses = {
  default: "bg-gradient-to-br from-background via-background to-background",
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
  default: "p-1 sm:p-2 lg:p-4",
  compact: "p-1 sm:p-2",
  spacious: "p-2 sm:p-4 lg:p-6"
};

/**
 * Standardized page container component with consistent backgrounds and spacing
 * Used across all pages for uniform layout and theming
 */
export const PageContainer = ({
  children,
  gradient = "blue-green",
  maxWidth = "full",
  padding = "default",
  className
}: PageContainerProps) => {
  return (
    <div className={cn(
      "min-h-screen",
      gradientClasses[gradient],
      className
    )}>
      <div className={cn(
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        "mx-auto space-y-2 sm:space-y-4"
      )}>
        {children}
      </div>
    </div>
  );
};