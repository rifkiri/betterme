
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabaseDataService } from '@/services/SupabaseDataService';
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
        const users = await supabaseDataService.getUsers();
        // Include both team members and managers, exclude only admins
        const members = users.filter(user => user.role !== 'admin');
        setTeamMembers(members);
        console.log('Team members loaded from Supabase (excluding admins):', members);
      } catch (error) {
        console.error('Failed to load team members from Supabase:', error);
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
          Choose a team member to view their productivity overview
          <span className="text-blue-600"> • Using Supabase Database</span>
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
                {member.name} - {member.position || member.role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};
