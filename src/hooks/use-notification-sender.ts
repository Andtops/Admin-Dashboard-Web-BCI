import { useState, useCallback } from 'react';
import { NotificationCreateRequest, NotificationResponse, RecipientType } from '@/types/notifications';

// Define form interface to match the one in use-notification-forms.ts
interface NotificationForm extends NotificationCreateRequest {
  recipientType: RecipientType;
}

export const useNotificationSender = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<NotificationResponse | null>(null);

  const sendNotification = useCallback(async (formData: NotificationForm): Promise<NotificationResponse> => {
    setIsLoading(true);
    setLastResult(null);

    try {
      const response = await fetch('/api/notifications/enhanced/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result: NotificationResponse = await response.json();
      setLastResult(result);
      
      return result;
    } catch (error) {
      console.error('Error sending notification:', error);
      const errorResult: NotificationResponse = {
        success: false,
        error: {
          code: 'SEND_FAILED',
          message: 'Failed to send notification'
        },
        timestamp: Date.now()
      };
      setLastResult(errorResult);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    sendNotification,
    isLoading,
    lastResult,
    clearResult,
  };
};