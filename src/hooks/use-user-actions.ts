import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export interface UserActionResult {
  success: boolean;
  emailSuccess: boolean;
  pushSuccess: boolean;
}

export function useUserActions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { admin } = useAuth();

  const approveUser = useMutation(api.users.approveUser);
  const rejectUser = useMutation(api.users.rejectUser);
  const getOrCreateAdmin = useMutation(api.admins.getOrCreateAdmin);

  const sendNotifications = useCallback(async (
    type: 'approval' | 'rejection',
    user: any,
    options: {
      customMessage?: string;
      rejectionReason?: string;
    } = {}
  ): Promise<{ emailSuccess: boolean; pushSuccess: boolean }> => {
    let emailSuccess = false;
    let pushSuccess = false;

    // Send email notification
    try {
      const emailPayload = {
        type,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        businessInfo: {
          businessName: user.businessName,
          gstNumber: user.gstNumber,
          isGstVerified: user.isGstVerified,
        },
        ...(type === 'approval' && { customMessage: options.customMessage }),
        ...(type === 'rejection' && { rejectionReason: options.rejectionReason }),
      };

      const emailResponse = await fetch('/api/gmail-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload),
      });

      const emailResult = await emailResponse.json();
      emailSuccess = emailResult.success;

      if (!emailSuccess) {
        console.warn("Email sending failed:", emailResult.error);
      }
    } catch (emailError) {
      console.error("Email sending error:", emailError);
    }

    // Send push notification
    try {
      const pushPayload = {
        type: type === 'approval' ? 'account_approval' : 'account_rejection',
        userId: user._id,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        ...(type === 'approval' && { customMessage: options.customMessage }),
        ...(type === 'rejection' && { rejectionReason: options.rejectionReason }),
      };

      const pushResponse = await fetch('/api/notifications/enhanced/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pushPayload),
      });

      const pushResult = await pushResponse.json();
      pushSuccess = pushResult.success;

      if (!pushSuccess) {
        console.warn("Push notification failed:", pushResult.error);
      }
    } catch (pushError) {
      console.error("Push notification error:", pushError);
    }

    return { emailSuccess, pushSuccess };
  }, []);

  const handleApproveUser = useCallback(async (
    user: any,
    customMessage?: string
  ): Promise<UserActionResult> => {
    if (!admin || !user) {
      toast.error("Invalid user or admin session");
      return { success: false, emailSuccess: false, pushSuccess: false };
    }

    setIsProcessing(true);
    try {
      // Get or create admin
      const adminId = await getOrCreateAdmin({ email: admin.email });

      // Approve user in database
      await approveUser({
        userId: user._id as any,
        adminId: adminId,
        customMessage: customMessage || undefined,
      });

      // Send notifications
      const { emailSuccess, pushSuccess } = await sendNotifications('approval', user, {
        customMessage,
      });

      // Show appropriate success message
      const getSuccessMessage = () => {
        if (emailSuccess && pushSuccess) {
          return "User approved! Email and push notifications sent successfully";
        } else if (emailSuccess || pushSuccess) {
          return `User approved! ${emailSuccess ? 'Email' : 'Push notification'} sent successfully`;
        } else {
          return "User approved successfully, but notifications failed";
        }
      };

      toast.success(getSuccessMessage());
      return { success: true, emailSuccess, pushSuccess };
    } catch (error) {
      toast.error("Failed to approve user");
      console.error(error);
      return { success: false, emailSuccess: false, pushSuccess: false };
    } finally {
      setIsProcessing(false);
    }
  }, [admin, approveUser, getOrCreateAdmin, sendNotifications]);

  const handleRejectUser = useCallback(async (
    user: any,
    rejectionReason: string,
    rejectionMessage?: string
  ): Promise<UserActionResult> => {
    if (!admin || !user || !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return { success: false, emailSuccess: false, pushSuccess: false };
    }

    setIsProcessing(true);
    try {
      // Get or create admin
      const adminId = await getOrCreateAdmin({ email: admin.email });

      // Reject user in database
      await rejectUser({
        userId: user._id as any,
        adminId: adminId,
        reason: rejectionReason,
        customMessage: rejectionMessage || undefined,
      });

      // Send notifications
      const { emailSuccess, pushSuccess } = await sendNotifications('rejection', user, {
        rejectionReason,
      });

      // Show appropriate success message
      const getSuccessMessage = () => {
        if (emailSuccess && pushSuccess) {
          return "User rejected! Email and push notifications sent successfully";
        } else if (emailSuccess || pushSuccess) {
          return `User rejected! ${emailSuccess ? 'Email' : 'Push notification'} sent successfully`;
        } else {
          return "User rejected successfully, but notifications failed";
        }
      };

      toast.success(getSuccessMessage());
      return { success: true, emailSuccess, pushSuccess };
    } catch (error) {
      toast.error("Failed to reject user");
      console.error(error);
      return { success: false, emailSuccess: false, pushSuccess: false };
    } finally {
      setIsProcessing(false);
    }
  }, [admin, rejectUser, getOrCreateAdmin, sendNotifications]);

  return {
    isProcessing,
    handleApproveUser,
    handleRejectUser,
  };
}