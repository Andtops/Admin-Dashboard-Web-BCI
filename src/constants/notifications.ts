import { NotificationType } from '@/types/notifications';

export const NOTIFICATION_TYPES: Record<NotificationType, string> = {
  account_approval: 'Account Approved',
  account_rejection: 'Account Rejected',
  new_product: 'New Product',
  order_update: 'Order Update',
  quotation_update: 'Quotation Update',
  promotion: 'Promotion',
  system: 'System',
  maintenance: 'Maintenance',
  update: 'Update',
  security: 'Security',
  general: 'General',
  user_registration: 'User Registration',
  user_approval: 'User Approval',
  user_rejection: 'User Rejection',
  product_update: 'Product Update',
  system_alert: 'System Alert',
  gst_verification: 'GST Verification',
  order_notification: 'Order Notification',
};

export const PRIORITY_COLORS = {
  urgent: 'destructive',
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
} as const;

export const NOTIFICATION_TABS = [
  { id: 'account', label: 'Account', icon: 'User' },
  { id: 'product', label: 'Product', icon: 'Package' },
  { id: 'order', label: 'Order', icon: 'ShoppingCart' },
  { id: 'promotion', label: 'Promotion', icon: 'Gift' },
  { id: 'system', label: 'System', icon: 'Settings' },
] as const;

export const PAGE_SIZE = 20;