
import { useState } from 'react';
import { WeeklyPlan } from '@/types/productivity';

export const useWeeklyPlans = () => {
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);

  const createWeeklyPlan = (plan: Omit<WeeklyPlan, 'id'>) => {
    const newPlan: WeeklyPlan = {
      ...plan,
      id: Date.now().toString(),
    };
    setWeeklyPlans(prev => [...prev, newPlan]);
  };

  return {
    weeklyPlans,
    createWeeklyPlan,
  };
};
