import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

const fetchName = async (userId: string): Promise<string> => {
  if (cache.has(userId)) return cache.get(userId)!;
  if (inflight.has(userId)) return inflight.get(userId)!;
  const promise = (async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .maybeSingle();
      const name = data?.name || 'Unknown';
      cache.set(userId, name);
      return name;
    } catch {
      return 'Unknown';
    } finally {
      inflight.delete(userId);
    }
  })();
  inflight.set(userId, promise);
  return promise;
};

export const useOwnerName = (userId?: string | null): { name: string | null; isLoading: boolean } => {
  const initial = userId && cache.has(userId) ? cache.get(userId)! : null;
  const [name, setName] = useState<string | null>(initial);
  const [isLoading, setIsLoading] = useState<boolean>(!!userId && !initial);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setName(null);
      setIsLoading(false);
      return;
    }
    if (cache.has(userId)) {
      setName(cache.get(userId)!);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetchName(userId).then(n => {
      if (!cancelled) {
        setName(n);
        setIsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [userId]);

  return { name, isLoading };
};
