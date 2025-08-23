import * as React from "react";
import { useState } from 'react';
import { BaseDialog } from './base-dialog';
import { useDialog } from '@/hooks/useDialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export type DateProcessingType = 'noon' | 'end-of-day' | 'as-is';
export type CalendarLayoutType = 'direct' | 'popover' | 'scroll';

export interface CalendarDialogProps {
  onSelectDate: (date: Date) => void;
  disabled?: boolean;
  title: string;
  description?: string;
  buttonText: string;
  triggerIcon: React.ReactNode;
  triggerClassName?: string;
  triggerTitle?: string;
  dateProcessing?: DateProcessingType;
  layout?: CalendarLayoutType;
  disablePastDates?: boolean;
  contentClassName?: string;
  label?: string;
  placeholder?: string;
}

/**
 * Standardized calendar dialog component that supports different layouts and date processing
 */
export const CalendarDialog = ({
  onSelectDate,
  disabled = false,
  title,
  description,
  buttonText,
  triggerIcon,
  triggerClassName,
  triggerTitle,
  dateProcessing = 'as-is',
  layout = 'direct',
  disablePastDates = false,
  contentClassName,
  label,
  placeholder = "Pick a date"
}: CalendarDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const dialog = useDialog();

  const processDate = (date: Date): Date => {
    switch (dateProcessing) {
      case 'noon':
        const noonDate = new Date(date);
        noonDate.setHours(12, 0, 0, 0);
        return noonDate;
      case 'end-of-day':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
      default:
        return date;
    }
  };

  const handleDateSelect = () => {
    if (selectedDate) {
      const processedDate = processDate(selectedDate);
      onSelectDate(processedDate);
      dialog.closeDialog();
      setSelectedDate(undefined);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      // Create date in local timezone for all layouts to ensure timezone safety
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      setSelectedDate(localDate);
      
      if (layout === 'popover') {
        setCalendarOpen(false);
      }
    }
  };

  // Get today's date for past date comparison
  const today = disablePastDates ? (() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  })() : undefined;

  const isDateDisabled = (date: Date): boolean => {
    if (!disablePastDates || !today) return false;
    const dateToCheck = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return dateToCheck < today;
  };

  const triggerButton = (
    <Button 
      size="sm" 
      variant="outline" 
      disabled={disabled}
      className={cn("h-8 w-8 p-0", triggerClassName)}
      title={triggerTitle}
    >
      {triggerIcon}
    </Button>
  );

  // Popover layout (like MoveGoalDialog)
  if (layout === 'popover') {
    return (
      <BaseDialog 
        open={dialog.open} 
        onOpenChange={dialog.setOpen}
        title={title}
        description={description}
        trigger={triggerButton}
        contentClassName={contentClassName || "sm:max-w-md"}
      >
        <div className="space-y-4">
          {label && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{label}</label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    {selectedDate ? (
                      format(selectedDate, "PPP")
                    ) : (
                      <span>{placeholder}</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleCalendarSelect}
                    disabled={isDateDisabled}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={dialog.closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleDateSelect} disabled={!selectedDate}>
              {buttonText}
            </Button>
          </div>
        </div>
      </BaseDialog>
    );
  }

  // Scroll layout (like MoveWeeklyOutputDialog)
  if (layout === 'scroll') {
    return (
      <BaseDialog
        open={dialog.open}
        onOpenChange={dialog.setOpen}
        title={title}
        description={description}
        trigger={triggerButton}
        contentClassName={contentClassName || "sm:max-w-[425px] max-h-[90vh] flex flex-col"}
        headerClassName="shrink-0"
      >
        <ScrollArea className="flex-1 px-1">
          <div className="flex flex-col items-center space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleCalendarSelect}
              disabled={isDateDisabled}
              className="rounded-md border pointer-events-auto"
            />
            {selectedDate && (
              <p className="text-sm text-gray-600">
                Moving to: {format(selectedDate, 'MMMM dd, yyyy')}
              </p>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex justify-center space-x-2 pt-4 shrink-0">
          <Button variant="outline" onClick={dialog.closeDialog}>
            Cancel
          </Button>
          <Button onClick={handleDateSelect} disabled={!selectedDate}>
            {buttonText}
          </Button>
        </div>
      </BaseDialog>
    );
  }

  // Direct layout (like MoveTaskDialog) - default
  return (
    <BaseDialog 
      open={dialog.open} 
      onOpenChange={dialog.setOpen}
      title={title}
      description={description}
      trigger={triggerButton}
      contentClassName={contentClassName || "sm:max-w-[425px]"}
    >
      <div className="flex flex-col items-center space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleCalendarSelect}
          disabled={isDateDisabled}
          className="rounded-md border pointer-events-auto"
          initialFocus
        />
        {selectedDate && (
          <p className="text-sm text-gray-600">
            Moving to: {format(selectedDate, 'MMMM dd, yyyy')}
          </p>
        )}
        <div className="flex space-x-2">
          <Button variant="outline" onClick={dialog.closeDialog}>
            Cancel
          </Button>
          <Button onClick={handleDateSelect} disabled={!selectedDate}>
            {buttonText}
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
};