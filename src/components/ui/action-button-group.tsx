import * as React from "react"
import { Eye, Trash2 } from "lucide-react"
import { IconButton } from "./icon-button"
import { cn } from "@/lib/utils"

export interface ActionButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  onView?: () => void;
  onDelete?: () => void;
  viewDisabled?: boolean;
  deleteDisabled?: boolean;
  viewTooltip?: string;
  deleteTooltip?: string;
  customActions?: React.ReactNode;
  layout?: "horizontal" | "vertical";
}

const ActionButtonGroup = React.forwardRef<HTMLDivElement, ActionButtonGroupProps>(
  ({ 
    className,
    onView,
    onDelete,
    viewDisabled = false,
    deleteDisabled = false,
    viewTooltip = "View Details",
    deleteTooltip = "Delete",
    customActions,
    layout = "horizontal",
    ...props 
  }, ref) => {
    const containerClass = layout === "vertical" 
      ? "flex flex-col items-center space-y-2" 
      : "flex items-center space-x-2";

    return (
      <div 
        ref={ref}
        className={cn(containerClass, className)} 
        {...props}
      >
        {onView && (
          <IconButton
            icon={<Eye className="h-4 w-4" />}
            onClick={onView}
            disabled={viewDisabled}
            tooltip={viewTooltip}
          />
        )}
        
        {customActions}
        
        {onDelete && (
          <IconButton
            icon={<Trash2 className="h-4 w-4" />}
            onClick={onDelete}
            disabled={deleteDisabled}
            tooltip={deleteTooltip}
            colorScheme="destructive"
          />
        )}
      </div>
    )
  }
)
ActionButtonGroup.displayName = "ActionButtonGroup"

export { ActionButtonGroup }