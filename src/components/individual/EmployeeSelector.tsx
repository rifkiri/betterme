
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { googleSheetsService } from '@/services/GoogleSheetsService';
import { User } from '@/types/userTypes';

interface EmployeeSelectorProps {
  selectedEmployee: string;
  onEmployeeChange: (value: string) => void;
}

export const EmployeeSelector = ({ selectedEmployee, onEmployeeChange }: EmployeeSelectorProps) => {
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTeamMembers = async () => {
      setIsLoading(true);
      try {
        if (googleSheetsService.isConfigured() && googleSheetsService.isAuthenticated()) {
          const users = await googleSheetsService.getUsers();
          const members = users.filter(user => user.role === 'team-member');
          setTeamMembers(members);
        }
      } catch (error) {
        console.error('Failed to load team members from Google Sheets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamMembers();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Team Member</CardTitle>
        <CardDescription>
          Choose a team member to view their detailed performance
          <span className="text-blue-600"> • Using Google Sheets</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={selectedEmployee} onValueChange={onEmployeeChange}>
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue placeholder={
              isLoading 
                ? "Loading team members..." 
                : teamMembers.length > 0 
                  ? "Select a team member" 
                  : "No team members available"
            } />
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
