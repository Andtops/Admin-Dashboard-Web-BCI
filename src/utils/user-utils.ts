import React from "react";
import { Badge } from "@/components/ui/badge";

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return React.createElement(Badge, { variant: "default", className: "bg-green-500" }, "Approved");
    case "pending":
      return React.createElement(Badge, { variant: "secondary" }, "Pending");
    case "rejected":
      return React.createElement(Badge, { variant: "destructive" }, "Rejected");
    case "suspended":
      return React.createElement(Badge, { variant: "outline", className: "border-orange-500 text-orange-500" }, "Suspended");
    default:
      return React.createElement(Badge, { variant: "outline" }, status);
  }
};

export const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatUserName = (user: { firstName?: string; lastName?: string }) => {
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
};

export const formatBusinessInfo = (user: {
  businessName?: string;
  legalNameOfBusiness?: string;
}) => {
  return {
    displayName: user.businessName || user.legalNameOfBusiness || 'No business name',
    legalName: user.legalNameOfBusiness,
  };
};

export const getUserDisplayInfo = (user: any) => {
  return {
    fullName: formatUserName(user),
    email: user.email || 'No email',
    phone: user.phone || 'No phone',
    business: formatBusinessInfo(user),
    status: user.status || 'unknown',
    registrationDate: user.createdAt ? formatDate(user.createdAt) : 'Unknown',
    lastUpdated: user.updatedAt ? formatDate(user.updatedAt) : 'Unknown',
  };
};

export const validateUserAction = (user: any, action: 'approve' | 'reject') => {
  if (!user) {
    return { isValid: false, error: 'No user selected' };
  }

  if (user.status !== 'pending') {
    return { 
      isValid: false, 
      error: `Cannot ${action} user with status: ${user.status}` 
    };
  }

  return { isValid: true, error: null };
};

export const getPaginationInfo = (
  currentPage: number,
  pageSize: number,
  totalItems: number
) => {
  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems);
  
  return {
    startItem,
    endItem,
    totalItems,
    hasNextPage: endItem < totalItems,
    hasPreviousPage: currentPage > 0,
    displayText: `Showing ${startItem} to ${endItem} of ${totalItems} users`,
  };
};