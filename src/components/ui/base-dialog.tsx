import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from "@/lib/utils";

export interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  trigger?: React.ReactNode;
  contentClassName?: string;
  headerClassName?: string;
  showHeader?: boolean;
  // Standardization props
  maxWidth?: "md" | "2xl";
  scrollHeight?: "80" | "96";
  gradientItems?: boolean;
  headerIcon?: React.ReactNode;
}

/**
 * Enhanced base dialog wrapper that preserves all existing styling patterns
 * Accepts contentClassName to match existing dialog styles exactly
 */
export const BaseDialog = ({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  children, 
  trigger,
  contentClassName,
  headerClassName,
  showHeader = true,
  maxWidth = "md",
  headerIcon
}: BaseDialogProps) => {
  // Generate standardized content class if not provided
  const standardContentClassName = contentClassName || `max-w-${maxWidth}`;
  
  const titleContent = headerIcon ? (
    <div className="flex items-center gap-2">
      {headerIcon}
      {title}
    </div>
  ) : title;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className={standardContentClassName}>
        {showHeader && (
          <DialogHeader className={headerClassName}>
            <DialogTitle>{titleContent}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
};