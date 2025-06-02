
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { localDataService } from '@/services/LocalDataService';

interface EmployeeSelectorProps {
  selectedEmployee: string;
  onEmployeeChange: (value: string) => void;
}

export const EmployeeSelector = ({ selectedEmployee, onEmployeeChange }: EmployeeSelectorProps) => {
  // Get all team members
  const users = localDataService.getUsers();
  const teamMembers = users.filter(user => user.role === 'team-member');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Team Member</CardTitle>
        <CardDescription>Choose a team member to view their detailed performance</CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={selectedEmployee} onValueChange={onEmployeeChange}>
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue placeholder={teamMembers.length > 0 ? "Select a team member" : "No team members available"} />
          </SelectTrigger>
          <SelectContent>
            {teamMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name} - {member.position || 'Team Member'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};
