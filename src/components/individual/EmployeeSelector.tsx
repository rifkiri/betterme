
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
            <SelectValue placeholder="No team members available" />
          </SelectTrigger>
          <SelectContent>
            {/* Employee options will be populated from real data */}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};
