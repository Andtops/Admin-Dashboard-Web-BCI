'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface NotificationFiltersProps {
  searchTerm: string;
  typeFilter: string;
  priorityFilter: string;
  readFilter: string;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onPriorityFilterChange: (value: string) => void;
  onReadFilterChange: (value: string) => void;
}

export const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  searchTerm,
  typeFilter,
  priorityFilter,
  readFilter,
  onSearchChange,
  onTypeFilterChange,
  onPriorityFilterChange,
  onReadFilterChange,
}) => {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search notifications..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select value={typeFilter} onValueChange={onTypeFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="user_registration">User Registration</SelectItem>
          <SelectItem value="user_approval">User Approval</SelectItem>
          <SelectItem value="product_update">Product Update</SelectItem>
          <SelectItem value="system_alert">System Alert</SelectItem>
          <SelectItem value="gst_verification">GST Verification</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priority</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={readFilter} onValueChange={onReadFilterChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="unread">Unread</SelectItem>
          <SelectItem value="read">Read</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};