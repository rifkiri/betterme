import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Card } from "./card"
import { cn } from "@/lib/utils"

const contentCardVariants = cva(
  "p-5 rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg backdrop-blur-md relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-background/70 border-border/50",
        success: "bg-green-500/5 border-green-500/20", 
        warning: "bg-yellow-500/5 border-yellow-500/20",
        danger: "bg-red-500/5 border-red-500/20",
        info: "bg-blue-500/5 border-blue-500/20",
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