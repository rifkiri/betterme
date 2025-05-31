
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmployeeSelectorProps {
  selectedEmployee: string;
  onEmployeeChange: (value: string) => void;
}

export const EmployeeSelector = ({ selectedEmployee, onEmployeeChange }: EmployeeSelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Team Member</CardTitle>
        <CardDescription>Choose a team member to view their detailed performance</CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={selectedEmployee} onValueChange={onEmployeeChange}>
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue placeholder="Select team member" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sarah-johnson">Sarah Johnson - Senior Developer</SelectItem>
            <SelectItem value="mike-chen">Mike Chen - Product Manager</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};
