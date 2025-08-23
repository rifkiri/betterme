import * as React from "react";
import { BaseDialog, BaseDialogProps } from './base-dialog';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';

export interface FormDialogProps extends Omit<BaseDialogProps, 'children'> {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  submitText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  formClassName?: string;
  footerClassName?: string;
  showFooter?: boolean;
  customFooter?: React.ReactNode;
}

/**
 * Form dialog wrapper that preserves existing form patterns and styling
 * Provides flexibility for custom footers and form layouts
 */
export const FormDialog = ({
  onSubmit,
  submitText = "Save",
  cancelText = "Cancel",
  isSubmitting = false,
  submitDisabled = false,
  formClassName,
  footerClassName,
  showFooter = true,
  customFooter,
  children,
  onOpenChange,
  ...baseProps
}: FormDialogProps) => {
  return (
    <BaseDialog {...baseProps} onOpenChange={onOpenChange}>
      <form onSubmit={onSubmit} className={formClassName}>
        {children}
        {showFooter && (
          customFooter || (
            <DialogFooter className={footerClassName}>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {cancelText}
              </Button>
              <Button type="submit" disabled={submitDisabled || isSubmitting}>
                {isSubmitting ? "Saving..." : submitText}
              </Button>
            </DialogFooter>
          )
        )}
      </form>
    </BaseDialog>
  );
};