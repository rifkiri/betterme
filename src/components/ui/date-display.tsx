import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, isToday, isTomorrow } from "date-fns"
import { cn } from "@/lib/utils"

export interface DateDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  date: Date;
  isOverdue?: boolean;
  showIcon?: boolean;
  prefix?: string;
  formatString?: string;
  variant?: "default" | "compact";
}

const DateDisplay = React.forwardRef<HTMLDivElement, DateDisplayProps>(
  ({ 
    className, 
    date, 
    isOverdue = false, 
    showIcon = true, 
    prefix = "Due:",
    formatString = "MMM dd",
    variant = "default",
    ...props 
  }, ref) => {
    const formatDate = () => {
      if (isToday(date)) return 'Today';
      if (isTomorrow(date)) return 'Tomorrow';
      return format(date, formatString);
    };

    const baseClasses = variant === "compact" ? "text-xs" : "text-xs";
    const colorClasses = isOverdue ? "text-red-600 font-medium" : "text-gray-500";

    return (
      <div 
        ref={ref}
        className={cn("flex items-center", baseClasses, colorClasses, className)}
        {...props}
      >
        {showIcon && <CalendarIcon className="h-3 w-3 mr-1" />}
        <span>
          {prefix} {formatDate()}
          {isOverdue && " (Overdue)"}
        </span>
      </div>
    )
  }
)
DateDisplay.displayName = "DateDisplay"

export { DateDisplay }