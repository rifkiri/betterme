
import { LucideIcon } from 'lucide-react';
import { StatCard } from '@/components/ui/standardized';

interface QuickStatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  gradient: string;
}

export const QuickStatsCard = ({ title, value, icon, gradient }: QuickStatsCardProps) => {
  // Map gradient prop to StatCard variant
  const variant = gradient.includes('blue') ? 'gradient' : 
                 gradient.includes('green') ? 'success' : 
                 gradient.includes('yellow') ? 'warning' : 
                 gradient.includes('red') ? 'danger' : 'default';
  
  return (
    <StatCard
      title={title}
      value={value}
      icon={icon}
      variant={variant}
    />
  );
};
