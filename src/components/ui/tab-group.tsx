import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  badge?: string | number;
}

export interface TabGroupProps {
  tabs: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  listClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
  orientation?: "horizontal" | "vertical";
  fullWidth?: boolean;
}

/**
 * Standardized tab group component with consistent styling and responsive behavior
 * Supports icons, badges, and controlled/uncontrolled modes
 */
export const TabGroup = ({
  tabs,
  defaultValue,
  value,
  onValueChange,
  className,
  listClassName,
  triggerClassName,
  contentClassName,
  orientation = "horizontal",
  fullWidth = false
}: TabGroupProps) => {
  const defaultTab = defaultValue || tabs[0]?.value;
  
  return (
    <Tabs 
      defaultValue={defaultTab}
      value={value}
      onValueChange={onValueChange}
      orientation={orientation}
      className={cn("w-full", className)}
    >
      <TabsList className={cn(
        "h-auto p-1",
        fullWidth && "grid w-full",
        fullWidth && `grid-cols-${tabs.length}`,
        orientation === "vertical" && "flex-col h-fit",
        listClassName
      )}>
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.value} 
            value={tab.value}
            className={cn(
              "flex items-center gap-2 data-[state=active]:bg-background",
              triggerClassName
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-muted">
                {tab.badge}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {tabs.map((tab) => (
        <TabsContent 
          key={tab.value} 
          value={tab.value}
          className={cn("mt-4", contentClassName)}
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};