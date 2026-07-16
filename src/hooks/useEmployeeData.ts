import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseDataService } from '@/services/SupabaseDataService';
import { EmployeeData } from '@/types/individualData';
import { transformUserToEmployeeData } from '@/utils/employeeDataTransformer';

const CACHE_KEY = 'betterme_employee_data_cache_v1';
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 min

interface CacheShape {
  timestamp: number;
  data: Record<string, EmployeeData>;
}

const readCache = (): Record<string, EmployeeData> | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CacheShape = JSON.parse(raw);
    if (!parsed || !parsed.data) return null;
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

const writeCache = (data: Record<string, EmployeeData>) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
  } catch {
    // ignore quota errors
  }
};

export const useEmployeeData = () => {
  const cached = readCache();
  const [employeeData, setEmployeeData] = useState<Record<string, EmployeeData>>(cached || {});
  const [isLoading, setIsLoading] = useState(!cached);

  useEffect(() => {
    let cancelled = false;

    const loadEmployeeData = async () => {
      if (!cached) setIsLoading(true);
      try {
        const users = await supabaseDataService.getUsers();
        const teamMembers = users.filter(user => user.role !== 'admin');

        // Parallel fetch across all team members (was sequential await-in-loop).
        const results = await Promise.all(
          teamMembers.map(async (user) => {
            try {
              const data = await transformUserToEmployeeData(user);
              return [user.id, data] as const;
            } catch (error) {
              console.error(`Failed to transform data for user ${user.id}:`, error);
              return null;
            }
          })
        );

        if (cancelled) return;

        const employeeDataMap: Record<string, EmployeeData> = {};
        for (const entry of results) {
          if (entry) employeeDataMap[entry[0]] = entry[1];
        }

        setEmployeeData(employeeDataMap);
        writeCache(employeeDataMap);
      } catch (error) {
        console.error('Failed to load employee data:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadEmployeeData();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { employeeData, isLoading };
};
