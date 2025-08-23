import { useState, useCallback } from 'react';

export interface UseDialogReturn {
  open: boolean;
  setOpen: (open: boolean) => void;
  openDialog: () => void;
  closeDialog: () => void;
  toggleDialog: () => void;
}

/**
 * Reusable dialog state management hook
 * Maintains exact same functionality as individual useState patterns
 */
export const useDialog = (initialOpen = false): UseDialogReturn => {
  const [open, setOpen] = useState(initialOpen);
  
  const openDialog = useCallback(() => setOpen(true), []);
  const closeDialog = useCallback(() => setOpen(false), []);
  const toggleDialog = useCallback(() => setOpen(prev => !prev), []);
  
  return {
    open,
    setOpen,
    openDialog,
    closeDialog,
    toggleDialog
  };
};