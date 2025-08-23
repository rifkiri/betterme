import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Standardized page header component with consistent styling
 * Used across all pages for uniform title and subtitle presentation
 */
export const PageHeader = ({
  title,
  subtitle,
  className,
  children
}: PageHeaderProps) => {
  return (
    <div className={cn("text-center mb-2 sm:mb-4 px-2", className)}>
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 sm:mb-2">
        {title}
      </h1>
      {subtitle && (
        <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
};