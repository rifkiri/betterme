import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Button, ButtonProps } from "./button"
import { cn } from "@/lib/utils"

const iconButtonVariants = cva(
  "h-8 w-8 p-0 shrink-0",
  {
    variants: {
      colorScheme: {
        default: "",
        destructive: "text-destructive hover:bg-destructive/10",
        success: "text-content-success-foreground hover:bg-content-success",
        warning: "text-content-warning-foreground hover:bg-content-warning",
        info: "text-content-info-foreground hover:bg-content-info",
      }
    },
    defaultVariants: {
      colorScheme: "default"
    },
  }
)

export interface IconButtonProps
  extends Omit<ButtonProps, 'size'>,
    VariantProps<typeof iconButtonVariants> {
  icon: React.ReactNode;
  tooltip?: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, colorScheme, icon, tooltip, variant = "outline", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        className={cn(iconButtonVariants({ colorScheme, className }))}
        title={tooltip}
        {...props}
      >
        {icon}
      </Button>
    )
  }
)
IconButton.displayName = "IconButton"

export { IconButton, iconButtonVariants }