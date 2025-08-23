import * as React from "react";
import { Label } from '@/components/ui/label';
import { cn } from "@/lib/utils";

export interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
  id?: string;
}

/**
 * Standardized form field wrapper with consistent label, error, and hint display
 * Wraps form inputs with proper spacing and validation feedback
 */
export const FieldWrapper = ({
  label,
  error,
  hint,
  required,
  children,
  className,
  labelClassName,
  id
}: FieldWrapperProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id} className={cn("text-sm font-medium", labelClassName)}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};