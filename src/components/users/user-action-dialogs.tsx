"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserCheck, UserX, RefreshCw } from "lucide-react";

interface UserApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onApprove: (customMessage?: string) => Promise<void>;
  isProcessing: boolean;
}

export function UserApprovalDialog({
  open,
  onOpenChange,
  user,
  onApprove,
  isProcessing,
}: UserApprovalDialogProps) {
  const [approvalMessage, setApprovalMessage] = useState("");

  const handleApprove = async () => {
    await onApprove(approvalMessage || undefined);
    setApprovalMessage("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setApprovalMessage("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            Approve User Account
          </DialogTitle>
          <DialogDescription>
            Approve {user?.firstName} {user?.lastName}'s account application.
            They will receive an email notification with your custom message.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="approval-message">Custom Message (Optional)</Label>
            <Textarea
              id="approval-message"
              placeholder="Add a personalized welcome message for the user..."
              value={approvalMessage}
              onChange={(e) => setApprovalMessage(e.target.value)}
              rows={4}
              disabled={isProcessing}
            />
            <p className="text-sm text-muted-foreground">
              This message will be included in the approval email to welcome the user.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Approve User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface UserRejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onReject: (reason: string, message?: string) => Promise<void>;
  isProcessing: boolean;
}

export function UserRejectionDialog({
  open,
  onOpenChange,
  user,
  onReject,
  isProcessing,
}: UserRejectionDialogProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionMessage, setRejectionMessage] = useState("");

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    
    await onReject(rejectionReason, rejectionMessage || undefined);
    setRejectionReason("");
    setRejectionMessage("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setRejectionReason("");
    setRejectionMessage("");
    onOpenChange(false);
  };

  const isValid = rejectionReason.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-red-600" />
            Reject User Account
          </DialogTitle>
          <DialogDescription>
            Reject {user?.firstName} {user?.lastName}'s account application.
            They will receive an email notification with the rejection reason.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Please provide a clear reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              required
              disabled={isProcessing}
            />
            <p className="text-sm text-muted-foreground">
              This reason will be included in the rejection email to help the user understand the decision.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rejection-message">Additional Message (Optional)</Label>
            <Textarea
              id="rejection-message"
              placeholder="Add any additional information or guidance for the user..."
              value={rejectionMessage}
              onChange={(e) => setRejectionMessage(e.target.value)}
              rows={3}
              disabled={isProcessing}
            />
            <p className="text-sm text-muted-foreground">
              Optional: Provide additional context or next steps for the user.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isProcessing || !isValid}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Reject User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}