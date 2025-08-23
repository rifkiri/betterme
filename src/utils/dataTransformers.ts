/**
 * Unified data transformation utilities for consistent data handling
 */

import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

// Date transformation utilities
export const dateTransformers = {
  /**
   * Format date for display with smart formatting
   */
  formatDisplayDate: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (isToday(dateObj)) return 'Today';
    if (isTomorrow(dateObj)) return 'Tomorrow';
    return format(dateObj, 'MMM dd');
  },

  /**
   * Format date for database storage
   */
  formatDatabaseDate: (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Create end of day date
   */
  createEndOfDay: (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  },

  /**
   * Check if date is overdue
   */
  isOverdue: (date: Date | string, completed: boolean = false): boolean => {
    if (completed) return false;
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isPast(dateObj) && !isToday(dateObj);
  }
};

// Priority transformation utilities
export const priorityTransformers = {
  /**
   * Get priority badge variant
   */
  getPriorityVariant: (priority: string): "high" | "medium" | "low" => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return "high";
      case 'medium':
        return "medium";
      case 'low':
      default:
        return "low";
    }
  },

  /**
   * Get priority color classes
   */
  getPriorityColor: (priority: string): string => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
      default:
        return 'text-green-600';
    }
  }
};

// Progress calculation utilities
export const progressTransformers = {
  /**
   * Calculate progress with bounds checking
   */
  calculateProgress: (current: number, change: number, min: number = 0, max: number = 100): number => {
    return Math.max(min, Math.min(max, current + change));
  },

  /**
   * Get progress status
   */
  getProgressStatus: (progress: number, isOverdue: boolean, isCompleted?: boolean): "completed" | "overdue" | "inProgress" => {
    if (isCompleted || progress === 100) return "completed";
    if (isOverdue) return "overdue";
    return "inProgress";
  },

  /**
   * Format progress display
   */
  formatProgress: (progress: number): string => {
    return `${Math.round(progress)}%`;
  }
};

// Array and list utilities
export const listTransformers = {
  /**
   * Group items by property
   */
  groupBy: <T>(items: T[], key: keyof T): Record<string, T[]> => {
    return items.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },

  /**
   * Sort items by date
   */
  sortByDate: <T extends { [K in DateKey]: Date | string }>(
    items: T[],
    dateKey: DateKey,
    direction: 'asc' | 'desc' = 'desc'
  ): T[] => {
    return [...items].sort((a, b) => {
      const dateA = typeof a[dateKey] === 'string' ? parseISO(a[dateKey] as string) : a[dateKey] as Date;
      const dateB = typeof b[dateKey] === 'string' ? parseISO(b[dateKey] as string) : b[dateKey] as Date;
      
      return direction === 'desc' 
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });
  },

  /**
   * Filter overdue items
   */
  filterOverdue: <T extends { dueDate?: Date | string; completed?: boolean }>(items: T[]): T[] => {
    return items.filter(item => 
      item.dueDate && dateTransformers.isOverdue(item.dueDate, item.completed)
    );
  },

  /**
   * Filter completed items
   */
  filterCompleted: <T extends { completed?: boolean; progress?: number }>(items: T[]): T[] => {
    return items.filter(item => item.completed || item.progress === 100);
  }
};

// Type helper for date keys
type DateKey = string;

// Validation utilities
export const validationTransformers = {
  /**
   * Validate required fields
   */
  validateRequired: (value: any, fieldName: string): string | null => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  /**
   * Validate date range
   */
  validateDateRange: (date: Date | string, minDate?: Date, maxDate?: Date): string | null => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (minDate && dateObj < minDate) {
      return `Date cannot be before ${format(minDate, 'MMM dd, yyyy')}`;
    }
    
    if (maxDate && dateObj > maxDate) {
      return `Date cannot be after ${format(maxDate, 'MMM dd, yyyy')}`;
    }
    
    return null;
  },

  /**
   * Validate progress range
   */
  validateProgress: (progress: number): string | null => {
    if (progress < 0 || progress > 100) {
      return 'Progress must be between 0 and 100';
    }
    return null;
  }
};