import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';

interface MarketplaceFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedSubcategory: string;
  onSubcategoryChange: (value: string) => void;
  selectedRole: string;
  onRoleChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedSubcategory,
  onSubcategoryChange,
  selectedRole,
  onRoleChange,
  sortBy,
  onSortChange,
  onClearFilters,
  hasActiveFilters
}) => {
  return (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search goals by title or description..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>

        {/* Subcategory Filter */}
        <Select value={selectedSubcategory} onValueChange={onSubcategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Subcategories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subcategories</SelectItem>
            <SelectItem value="project">Project Management</SelectItem>
            <SelectItem value="sales">Sales & Marketing</SelectItem>
            <SelectItem value="internal">Internal Process</SelectItem>
          </SelectContent>
        </Select>

        {/* Role Filter */}
        <Select value={selectedRole} onValueChange={onRoleChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Available Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="coach">Coach Available</SelectItem>
            <SelectItem value="lead">Lead Available</SelectItem>
            <SelectItem value="member">Member Spots</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="deadline">Deadline (Urgent)</SelectItem>
            <SelectItem value="progress-asc">Progress (Low to High)</SelectItem>
            <SelectItem value="progress-desc">Progress (High to Low)</SelectItem>
            <SelectItem value="team-size">Team Size</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="h-9"
          >
            <X className="h-3 w-3 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};