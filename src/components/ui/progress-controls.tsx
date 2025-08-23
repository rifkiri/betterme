import * as React from "react"
import { Button } from "./button"
import { Minus, Plus, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ProgressControlsProps extends React.HTMLAttributes<HTMLDivElement> {
  progress: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onComplete?: () => void;
  disabled?: boolean;
  step?: number;
  showCompleteButton?: boolean;
}

const ProgressControls = React.forwardRef<HTMLDivElement, ProgressControlsProps>(
  ({ 
    className, 
    progress, 
    onDecrease, 
    onIncrease, 
    onComplete,
    disabled = false,
    step = 10,
    showCompleteButton = true,
    ...props 
  }, ref) => {
    const canDecrease = !disabled && progress > 0;
    const canIncrease = !disabled && progress < 100;
    const canComplete = !disabled && progress !== 100 && showCompleteButton && onComplete;

    return (
      <div 
        ref={ref}
        className={cn("flex items-center space-x-2", className)} 
        {...props}
      >
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onDecrease}
          disabled={!canDecrease}
          className="h-8 w-8 p-0"
          title={`Decrease Progress by ${step}%`}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onIncrease}
          disabled={!canIncrease}
          className="h-8 w-8 p-0"
          title={`Increase Progress by ${step}%`}
        >
          <Plus className="h-4 w-4" />
        </Button>
        
        {canComplete && (
          <Button 
            size="sm" 
            variant="default" 
            onClick={onComplete}
            className="h-8 w-8 p-0"
            title="Mark as Achieved"
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }
)
ProgressControls.displayName = "ProgressControls"

export { ProgressControls }