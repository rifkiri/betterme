import * as React from "react"
import { cn } from "@/lib/utils"

export interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  spacing?: "tight" | "normal" | "loose";
  responsive?: boolean;
}

const getMaxWidthClass = (maxWidth: string) => {
  switch (maxWidth) {
    case "sm": return "max-w-sm";
    case "md": return "max-w-md";
    case "lg": return "max-w-4xl";
    case "xl": return "max-w-6xl";
    case "2xl": return "max-w-7xl";
    case "full": return "max-w-full";
    default: return "max-w-4xl";
  }
};

const getSpacingClass = (spacing: string) => {
  switch (spacing) {
    case "tight": return "space-y-4";
    case "loose": return "space-y-8";
    default: return "space-y-6";
  }
};

const PageLayout = React.forwardRef<HTMLDivElement, PageLayoutProps>(
  ({ 
    className,
    children,
    header,
    sidebar,
    maxWidth = "lg",
    spacing = "normal",
    responsive = true,
    ...props 
  }, ref) => {
    const containerClasses = cn(
      "min-h-screen w-full",
      responsive && "px-4 sm:px-6 lg:px-8",
      !responsive && "px-4"
    );

    const contentClasses = cn(
      "mx-auto",
      getMaxWidthClass(maxWidth),
      getSpacingClass(spacing)
    );

    if (sidebar) {
      return (
        <div ref={ref} className={cn(containerClasses, className)} {...props}>
          <div className="flex gap-6">
            <aside className="w-64 flex-shrink-0 hidden lg:block">
              {sidebar}
            </aside>
            <main className="flex-1 min-w-0">
              {header && (
                <header className="mb-6">
                  {header}
                </header>
              )}
              <div className={contentClasses}>
                {children}
              </div>
            </main>
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn(containerClasses, className)} {...props}>
        {header && (
          <header className="mb-6">
            <div className={cn("mx-auto", getMaxWidthClass(maxWidth))}>
              {header}
            </div>
          </header>
        )}
        <main className={contentClasses}>
          {children}
        </main>
      </div>
    );
  }
)
PageLayout.displayName = "PageLayout"

export { PageLayout }