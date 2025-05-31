
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface QuickStatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  gradient: string;
}

export const QuickStatsCard = ({ title, value, icon: Icon, gradient }: QuickStatsCardProps) => {
  return (
    <Card className={gradient}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
          </div>
          <Icon className="h-8 w-8 text-gray-600" />
        </div>
      </CardContent>
    </Card>
  );
};
