import { useState } from 'react';
import { NotificationCreateRequest, NotificationType, NotificationPriority, RecipientType } from '@/types/notifications';
import { getDefaultPriority } from '@/lib/notification-constants';

// Define form interface based on NotificationCreateRequest
interface NotificationForm {
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  recipientType: RecipientType;
  recipientId?: string;
  metadata?: Record<string, any>;
  scheduledFor?: number;
}

const createInitialForm = (type: NotificationType): NotificationForm => {
  const baseForm: NotificationForm = {
    type,
    title: '',
    message: '',
    priority: getDefaultPriority(type),
    recipientType: 'all_admins'
  };

  return baseForm;
};

export const useNotificationForms = () => {
  const [accountForm, setAccountForm] = useState<NotificationForm>(
    createInitialForm('user_approval')
  );
  
  const [productForm, setProductForm] = useState<NotificationForm>(
    createInitialForm('product_update')
  );
  
  const [orderForm, setOrderForm] = useState<NotificationForm>(
    createInitialForm('order_notification')
  );
  
  const [gstForm, setGstForm] = useState<NotificationForm>(
    createInitialForm('gst_verification')
  );
  
  const [systemForm, setSystemForm] = useState<NotificationForm>(
    createInitialForm('system_alert')
  );

  const resetForm = (tab: string) => {
    switch (tab) {
      case 'account':
        setAccountForm(createInitialForm('user_approval'));
        break;
      case 'product':
        setProductForm(createInitialForm('product_update'));
        break;
      case 'order':
        setOrderForm(createInitialForm('order_notification'));
        break;
      case 'gst':
        setGstForm(createInitialForm('gst_verification'));
        break;
      case 'system':
        setSystemForm(createInitialForm('system_alert'));
        break;
    }
  };

  const getFormByTab = (tab: string) => {
    switch (tab) {
      case 'account': return accountForm;
      case 'product': return productForm;
      case 'order': return orderForm;
      case 'gst': return gstForm;
      case 'system': return systemForm;
      default: return accountForm;
    }
  };

  const setFormByTab = (tab: string, form: NotificationForm) => {
    switch (tab) {
      case 'account': setAccountForm(form); break;
      case 'product': setProductForm(form); break;
      case 'order': setOrderForm(form); break;
      case 'gst': setGstForm(form); break;
      case 'system': setSystemForm(form); break;
    }
  };

  return {
    forms: {
      account: accountForm,
      product: productForm,
      order: orderForm,
      gst: gstForm,
      system: systemForm,
    },
    setters: {
      setAccountForm,
      setProductForm,
      setOrderForm,
      setGstForm,
      setSystemForm,
    },
    resetForm,
    getFormByTab,
    setFormByTab,
  };
};