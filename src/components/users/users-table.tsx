"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, UserCheck, UserX, Eye } from "lucide-react";
import { getStatusBadge, formatDate, getUserDisplayInfo } from "@/utils/user-utils";

interface UsersTableProps {
  users: any[];
  onViewDetails: (user: any) => void;
  onApprove: (user: any) => void;
  onReject: (user: any) => void;
}

export function UsersTable({ users, onViewDetails, onApprove, onReject }: UsersTableProps) {
  if (!users || users.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center">
          <p className="text-muted-foreground">No users found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Business</TableHead>
            <TableHead>GST</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const userInfo = getUserDisplayInfo(user);
            
            return (
              <TableRow key={user._id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{userInfo.fullName}</div>
                    <div className="text-sm text-muted-foreground">{userInfo.email}</div>
                    {user.phone && (
                      <div className="text-sm text-muted-foreground">{user.phone}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    {userInfo.business.displayName !== 'No business name' && (
                      <div className="font-medium">{userInfo.business.displayName}</div>
                    )}
                    {userInfo.business.legalName && userInfo.business.legalName !== userInfo.business.displayName && (
                      <div className="text-sm text-muted-foreground">
                        {userInfo.business.legalName}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    {user.gstNumber && (
                      <div className="font-mono text-sm">{user.gstNumber}</div>
                    )}
                    {user.isGstVerified && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Verified
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(user.status)}
                </TableCell>
                <TableCell>
                  <div className="text-sm">{userInfo.registrationDate}</div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onViewDetails(user)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user.status === "pending" && (
                        <>
                          <DropdownMenuItem
                            onClick={() => onApprove(user)}
                            className="text-green-600"
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Approve User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onReject(user)}
                            className="text-red-600"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Reject User
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}