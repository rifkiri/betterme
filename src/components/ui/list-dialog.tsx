import * as React from "react";
import { BaseDialog, BaseDialogProps } from './base-dialog';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";

export interface ListDialogProps extends Omit<BaseDialogProps, 'children' | 'trigger'> {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  triggerIcon: React.ReactNode;
  triggerText: string;
  emptyMessage?: string;
  scrollHeight?: "80" | "96";
  gradientItems?: boolean;
}

/**
 * Enhanced specialized dialog for displaying lists with standardized scroll areas and styling
 * Handles empty states and provides consistent trigger buttons
 */
export const ListDialog = ({
  items,
  renderItem,
  triggerIcon,
  triggerText,
  emptyMessage = "No items",
  scrollHeight = "80",
  gradientItems = false,
  ...baseProps
}: ListDialogProps) => {
  const scrollClassName = `space-y-3 max-h-${scrollHeight} overflow-y-auto`;

  const trigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-2">
      {triggerIcon}
      <span>{triggerText} ({items.length})</span>
    </Button>
  );

  return (
    <BaseDialog {...baseProps} trigger={trigger}>
      <div className={scrollClassName}>
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">{emptyMessage}</p>
        ) : (
          items.map((item, index) => (
            <div 
              key={item.id || index} 
              className={cn(
                "p-3 border rounded-lg",
                gradientItems 
                  ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200"
                  : "border-border"
              )}
            >
              {renderItem(item, index)}
            </div>
          ))
        )}
      </div>
    </BaseDialog>
  );
};