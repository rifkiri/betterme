import { useState, useEffect } from 'react';
import { itemLinkageService, LinkedItem } from '@/services/ItemLinkageService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseItemLinkagesProps {
  itemType: 'goal' | 'task' | 'weekly_output' | 'habit';
  itemId: string;
}

export const useItemLinkages = ({ itemType, itemId }: UseItemLinkagesProps) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [linkedItems, setLinkedItems] = useState<LinkedItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLinkedItems = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const items = await itemLinkageService.getLinkedItems(itemType, itemId, userId);
      setLinkedItems(items);
    } catch (error) {
      console.error('Error loading linked items:', error);
      toast.error('Failed to load linked items');
    } finally {
      setLoading(false);
    }
  };

  const linkItem = async (
    targetType: 'goal' | 'task' | 'weekly_output' | 'habit',
    targetId: string
  ) => {
    if (!userId) return;
    
    try {
      await itemLinkageService.createLink(itemType, itemId, targetType, targetId, userId);
      await loadLinkedItems();
      toast.success('Item linked successfully');
    } catch (error) {
      console.error('Error linking item:', error);
      toast.error('Failed to link item');
    }
  };

  const unlinkItem = async (
    targetType: 'goal' | 'task' | 'weekly_output' | 'habit',
    targetId: string
  ) => {
    if (!userId) return;
    
    try {
      await itemLinkageService.removeLink(itemType, itemId, targetType, targetId, userId);
      await loadLinkedItems();
      toast.success('Item unlinked successfully');
    } catch (error) {
      console.error('Error unlinking item:', error);
      toast.error('Failed to unlink item');
    }
  };

  const updateLinks = async (
    targetType: 'goal' | 'task' | 'weekly_output' | 'habit',
    targetIds: string[]
  ) => {
    if (!userId) return;
    
    try {
      await itemLinkageService.updateLinks(itemType, itemId, targetType, targetIds, userId);
      await loadLinkedItems();
      toast.success('Links updated successfully');
    } catch (error) {
      console.error('Error updating links:', error);
      toast.error('Failed to update links');
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadLinkedItems();
    }
  }, [itemType, itemId, userId]);

  return {
    linkedItems,
    loading,
    linkItem,
    unlinkItem,
    updateLinks,
    refresh: loadLinkedItems
  };
};