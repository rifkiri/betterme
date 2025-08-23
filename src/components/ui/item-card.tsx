import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ContentCard } from "./content-card"
import { ActionButtonGroup } from "./action-button-group"
import { cn } from "@/lib/utils"

const itemCardVariants = cva(
  "transition-all duration-200",
  {
    variants: {
      state: {
        default: "",
        completed: "opacity-80",
        overdue: "",
        interactive: "hover:shadow-sm cursor-pointer"
      }
    },
    defaultVariants: {
      state: "default"
    },
  }
)

export interface ItemCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof itemCardVariants> {
  children: React.ReactNode;
  isCompleted?: boolean;
  isOverdue?: boolean;
  isInteractive?: boolean;
  actions?: {
    onView?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onMove?: () => void;
    customActions?: React.ReactNode;
  };
  header?: React.ReactNode;
  badges?: React.ReactNode;
  metadata?: React.ReactNode;
}

const ItemCard = React.forwardRef<HTMLDivElement, ItemCardProps>(
  ({ 
    className,
    state,
    children,
    isCompleted = false,
    isOverdue = false,
    isInteractive = false,
    actions,
    header,
    badges,
    metadata,
    ...props 
  }, ref) => {
    // Determine card variant based on state
    const cardVariant = isOverdue ? "danger" : isCompleted ? "success" : "default";
    
    // Determine item state
    const itemState = isCompleted ? "completed" : isOverdue ? "overdue" : isInteractive ? "interactive" : "default";

    return (
      <ContentCard
        ref={ref}
        variant={cardVariant}
        className={cn(itemCardVariants({ state: itemState }), className)}
        {...props}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {header && (
              <div className="mb-2">
                {header}
              </div>
            )}
            
            <div className="space-y-2">
              {children}
              
              {badges && (
                <div className="flex flex-wrap gap-1">
                  {badges}
                </div>
              )}
              
              {metadata && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {metadata}
                </div>
              )}
            </div>
          </div>
          
          {actions && (
            <div className="flex-shrink-0">
              <ActionButtonGroup
                onView={actions.onView}
                onDelete={actions.onDelete}
                customActions={
                  <div className="flex items-center space-x-2">
                    {actions.customActions}
                  </div>
                }
                layout="vertical"
              />
            </div>
          )}
        </div>
      </ContentCard>
    )
  }
)
ItemCard.displayName = "ItemCard"

export { ItemCard, itemCardVariants }