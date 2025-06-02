import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Database, Download, Loader2, Trash2 } from 'lucide-react';
import { Habit, Task, WeeklyOutput } from '@/types/productivity';
import { toast } from 'sonner';
interface DataManagementSectionProps {
  habits: Habit[];
  tasks: Task[];
  weeklyOutputs: WeeklyOutput[];
  moodEntries: any[];
  onRefreshData: () => Promise<void>;
  userRole?: string;
}
export const DataManagementSection = ({
  habits,
  tasks,
  weeklyOutputs,
  moodEntries,
  onRefreshData,
  userRole
}: DataManagementSectionProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshData();
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };
  const handleExportData = () => {
    const data = {
      habits,
      tasks,
      weeklyOutputs,
      moodEntries,
      exportDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `productivity-data-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('Data exported successfully');
  };
  return <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Manage your productivity and mood tracking data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{habits.length}</p>
              <p className="text-xs text-gray-600">Habits</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{tasks.length}</p>
              <p className="text-xs text-gray-600">Tasks</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{weeklyOutputs.length}</p>
              <p className="text-xs text-gray-600">Outputs</p>
            </div>
            <div className="text-center p-3 bg-pink-50 rounded-lg">
              <p className="text-2xl font-bold text-pink-600">{moodEntries.length}</p>
              <p className="text-xs text-gray-600">Mood Entries</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleRefreshData} variant="outline" disabled={isRefreshing} className="flex-1">
              {isRefreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
              Refresh Data
            </Button>
            
            <Button onClick={handleExportData} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone - Only for Admins */}
      {userRole === 'admin'}
    </>;
};