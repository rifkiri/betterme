import { useState, useCallback } from 'react';

export interface CrudState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  selectedItem: T | null;
}

export interface CrudOperations<T, TCreate = Omit<T, 'id'>, TUpdate = Partial<T>> {
  // State
  state: CrudState<T>;
  
  // Basic operations
  create: (item: TCreate) => Promise<void>;
  update: (id: string, updates: TUpdate) => Promise<void>;
  delete: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  
  // Selection
  selectItem: (item: T | null) => void;
  
  // Utilities
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setItems: (items: T[]) => void;
}

/**
 * Unified CRUD operations hook that standardizes common data patterns
 * Provides consistent loading states, error handling, and operation patterns
 */
export const useCrudOperations = <T extends { id: string }, TCreate = Omit<T, 'id'>, TUpdate = Partial<T>>(
  initialItems: T[] = [],
  operations: {
    create: (item: TCreate) => Promise<T>;
    update: (id: string, updates: TUpdate) => Promise<T>;
    delete: (id: string) => Promise<void>;
    fetch?: () => Promise<T[]>;
  }
): CrudOperations<T, TCreate, TUpdate> => {
  const [items, setItems] = useState<T[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const handleError = useCallback((err: any, operation: string) => {
    console.error(`Error in ${operation}:`, err);
    setError(err?.message || `Failed to ${operation}`);
    setLoading(false);
  }, []);

  const create = useCallback(async (item: TCreate) => {
    try {
      setLoading(true);
      setError(null);
      const newItem = await operations.create(item);
      setItems(prev => [newItem, ...prev]);
      setLoading(false);
    } catch (err) {
      handleError(err, 'create');
    }
  }, [operations.create, handleError]);

  const update = useCallback(async (id: string, updates: TUpdate) => {
    try {
      setLoading(true);
      setError(null);
      const updatedItem = await operations.update(id, updates);
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      if (selectedItem?.id === id) {
        setSelectedItem(updatedItem);
      }
      setLoading(false);
    } catch (err) {
      handleError(err, 'update');
    }
  }, [operations.update, selectedItem, handleError]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await operations.delete(id);
      setItems(prev => prev.filter(item => item.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      setLoading(false);
    } catch (err) {
      handleError(err, 'delete');
    }
  }, [operations.delete, selectedItem, handleError]);

  const refresh = useCallback(async () => {
    if (!operations.fetch) return;
    
    try {
      setLoading(true);
      setError(null);
      const freshItems = await operations.fetch();
      setItems(freshItems);
      setLoading(false);
    } catch (err) {
      handleError(err, 'refresh');
    }
  }, [operations.fetch, handleError]);

  const selectItem = useCallback((item: T | null) => {
    setSelectedItem(item);
  }, []);

  return {
    state: {
      items,
      loading,
      error,
      selectedItem
    },
    create,
    update,
    delete: deleteItem,
    refresh,
    selectItem,
    setLoading,
    setError,
    setItems
  };
};