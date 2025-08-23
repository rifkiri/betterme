import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from "@/lib/utils";

export interface EntitySectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  headerActions?: React.ReactNode;
  navigationElement?: React.ReactNode;
  children: React.ReactNode;
  overdueSection?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  emptyMessage?: string;
  isEmpty?: boolean;
}

/**
 * Standardized section wrapper for Tasks, Goals, Weekly Outputs, etc.
 * Provides consistent layout, header, navigation, and overdue sections
 */
export const EntitySection = ({
  title,
  description,
  icon,
  headerActions,
  navigationElement,
  children,
  overdueSection,
  className,
  contentClassName,
  emptyMessage = "No items to display",
  isEmpty = false
}: EntitySectionProps) => {
  return (
    <Card className={cn("h-fit", className)}>
      <CardHeader className="space-y-4 pb-2 sm:pb-4">
        <div>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            {icon}
            <span className="truncate">{title}</span>
          </CardTitle>
          {description && (
            <CardDescription className="text-xs sm:text-sm">
              {description}
            </CardDescription>
          )}
        </div>
        {headerActions && (
          <div className="space-y-2">
            {headerActions}
          </div>
        )}
      </CardHeader>
      <CardContent className={cn("space-y-2 sm:space-y-3", contentClassName)}>
        {navigationElement}
        
        {/* Main content */}
        <div className="space-y-2">
          {isEmpty ? (
            <p className="text-center text-muted-foreground py-4 text-sm">
              {emptyMessage}
            </p>
          ) : (
            children
          )}
        </div>
        
        {/* Optional overdue section */}
        {overdueSection && (
          <div className="border-t pt-2 sm:pt-3 mt-2 sm:mt-3">
            {overdueSection}
          </div>
        )}
      </CardContent>
    </Card>
  );
};