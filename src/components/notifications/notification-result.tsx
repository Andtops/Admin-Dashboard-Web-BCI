'use client';

import { CheckCircle, XCircle } from 'lucide-react';
import { NotificationResponse } from '@/types/notifications';

interface NotificationResultProps {
  result: NotificationResponse | null;
}

export const NotificationResult: React.FC<NotificationResultProps> = ({ result }) => {
  if (!result) return null;

  if (result.success) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <div>
          <p className="text-sm font-medium text-green-800">
            Notification sent successfully!
          </p>
          {result.data?.tokensCount && (
            <p className="text-xs text-green-600">
              Delivered to {result.data.tokensCount} devices
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
      <XCircle className="w-5 h-5 text-red-600" />
      <div>
        <p className="text-sm font-medium text-red-800">
          Failed to send notification
        </p>
        <p className="text-xs text-red-600">
          {result.error}
        </p>
      </div>
    </div>
  );
};