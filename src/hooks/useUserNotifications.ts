import { toast } from "sonner";

interface NotificationResult {
  emailSuccess: boolean;
  pushSuccess: boolean;
}

interface ApprovalNotificationData {
  userEmail: string;
  userName: string;
  customMessage?: string;
  businessInfo: {
    businessName?: string;
    gstNumber?: string;
    isGstVerified?: boolean;
  };
}

interface RejectionNotificationData {
  userEmail: string;
  userName: string;
  rejectionReason: string;
  businessInfo: {
    businessName?: string;
    gstNumber?: string;
  };
}

export function useUserNotifications() {
  const sendApprovalNotifications = async (
    userId: string,
    data: ApprovalNotificationData
  ): Promise<NotificationResult> => {
    let emailSuccess = false;
    let pushSuccess = false;

    // Send approval email
    try {
      const emailResponse = await fetch('/api/gmail-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'approval',
          ...data,
        }),
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
      const pushResponse = await fetch('/api/notifications/enhanced/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'account_approval',
          userId,
          userEmail: data.userEmail,
          userName: data.userName,
          customMessage: data.customMessage,
        }),
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
  };

  const sendRejectionNotifications = async (
    userId: string,
    data: RejectionNotificationData
  ): Promise<NotificationResult> => {
    let emailSuccess = false;
    let pushSuccess = false;

    // Send rejection email
    try {
      const emailResponse = await fetch('/api/gmail-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rejection',
          ...data,
        }),
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
      const pushResponse = await fetch('/api/notifications/enhanced/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'account_rejection',
          userId,
          userEmail: data.userEmail,
          userName: data.userName,
          rejectionReason: data.rejectionReason,
        }),
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
  };

  const showNotificationResult = (result: NotificationResult, action: 'approved' | 'rejected') => {
    const { emailSuccess, pushSuccess } = result;
    
    if (emailSuccess && pushSuccess) {
      toast.success(`User ${action}! Email and push notifications sent successfully`);
    } else if (emailSuccess || pushSuccess) {
      toast.success(`User ${action}! ${emailSuccess ? 'Email' : 'Push notification'} sent successfully`);
    } else {
      toast.success(`User ${action} successfully, but notifications failed`);
    }
  };

  return {
    sendApprovalNotifications,
    sendRejectionNotifications,
    showNotificationResult,
  };
}