import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TeamWorkloadChartsProps {
  chartData: Array<{
    name: string;
    fullName: string;
    goals: number;
    outputs: number;
    tasks: number;
    project: number;
    sales: number;
    internal: number;
  }>;
  chartType: 'goals' | 'outputs' | 'tasks';
  onMemberClick: (memberId: string) => void;
}

export const TeamWorkloadCharts = ({ chartData, chartType, onMemberClick }: TeamWorkloadChartsProps) => {
  const getChartConfig = () => {
    switch (chartType) {
      case 'goals':
        return {
          title: 'Goals Distribution',
          description: 'Number of goals assigned per team member',
          dataKey: 'goals',
          fill: '#3B82F6',
          stackedBars: [
            { dataKey: 'project', fill: '#3B82F6', name: 'Project Goals' },
            { dataKey: 'sales', fill: '#10B981', name: 'Sales Goals' },
            { dataKey: 'internal', fill: '#8B5CF6', name: 'Internal Goals' }
          ]
        };
      case 'outputs':
        return {
          title: 'Bi-Weekly Outputs Distribution',
          description: 'Number of active bi-weekly outputs per team member',
          dataKey: 'outputs',
          fill: '#10B981'
        };
      case 'tasks':
        return {
          title: 'Active Tasks Distribution',
          description: 'Number of active tasks per team member',
          dataKey: 'tasks',
          fill: '#8B5CF6'
        };
      default:
        return {
          title: 'Workload Distribution',
          description: 'Team member workload distribution',
          dataKey: 'goals',
          fill: '#3B82F6'
        };
    }
  };

  const config = getChartConfig();
  const hasData = chartData.some(item => item[config.dataKey] > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (chartType === 'goals' && config.stackedBars) {
                    const displayName = config.stackedBars.find(bar => bar.dataKey === name)?.name || name;
                    return [value, displayName];
                  }
                  return [value, config.title.split(' ')[0]];
                }}
                labelFormatter={(label) => {
                  const member = chartData.find(d => d.name === label);
                  return member ? member.fullName : label;
                }}
              />
              {chartType === 'goals' && config.stackedBars ? (
                config.stackedBars.map((bar, index) => (
                  <Bar 
                    key={index}
                    dataKey={bar.dataKey} 
                    stackId="goals"
                    fill={bar.fill} 
                    name={bar.dataKey}
                  />
                ))
              ) : (
                <Bar dataKey={config.dataKey} fill={config.fill} />
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No {config.title.toLowerCase()} data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};