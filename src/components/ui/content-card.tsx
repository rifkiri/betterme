import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Card } from "./card"
import { cn } from "@/lib/utils"

const contentCardVariants = cva(
  "p-4 rounded-lg border transition-colors",
  {
    variants: {
      variant: {
        default: "bg-content-default border-content-default-border",
        success: "bg-content-success border-content-success-border", 
        warning: "bg-content-warning border-content-warning-border",
        danger: "bg-content-danger border-content-danger-border",
        info: "bg-content-info border-content-info-border",
      },
      hover: {
        true: "hover:opacity-80",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      hover: false
    },
  }
)

export interface ContentCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof contentCardVariants> {
  children: React.ReactNode;
}

const ContentCard = React.forwardRef<HTMLDivElement, ContentCardProps>(
  ({ className, variant, hover, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(contentCardVariants({ variant, hover, className }))}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ContentCard.displayName = "ContentCard"

export { ContentCard, contentCardVariants }