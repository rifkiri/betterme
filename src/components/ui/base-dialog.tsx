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
}

/**
 * Base dialog wrapper that preserves all existing styling patterns
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
  showHeader = true
}: BaseDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className={contentClassName}>
        {showHeader && (
          <DialogHeader className={headerClassName}>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
};