import { useState } from 'react';
import { NotificationForm, NotificationType } from '@/types/notifications';

const createInitialForm = (type: NotificationType): NotificationForm => {
  const baseForm: NotificationForm = {
    type,
    title: '',
    message: '',
    priority: type === 'account_approval' || type === 'account_rejection' || type === 'order_update' ? 'high' : 'normal'
  };

  return baseForm;
};

export const useNotificationForms = () => {
  const [accountForm, setAccountForm] = useState<NotificationForm>(
    createInitialForm('account_approval')
  );
  
  const [productForm, setProductForm] = useState<NotificationForm>(
    createInitialForm('new_product')
  );
  
  const [orderForm, setOrderForm] = useState<NotificationForm>(
    createInitialForm('order_update')
  );
  
  const [promoForm, setPromoForm] = useState<NotificationForm>(
    createInitialForm('promotion')
  );
  
  const [systemForm, setSystemForm] = useState<NotificationForm>(
    createInitialForm('system')
  );

  const resetForm = (tab: string) => {
    switch (tab) {
      case 'account':
        setAccountForm(createInitialForm('account_approval'));
        break;
      case 'product':
        setProductForm(createInitialForm('new_product'));
        break;
      case 'order':
        setOrderForm(createInitialForm('order_update'));
        break;
      case 'promotion':
        setPromoForm(createInitialForm('promotion'));
        break;
      case 'system':
        setSystemForm(createInitialForm('system'));
        break;
    }
  };

  const getFormByTab = (tab: string) => {
    switch (tab) {
      case 'account': return accountForm;
      case 'product': return productForm;
      case 'order': return orderForm;
      case 'promotion': return promoForm;
      case 'system': return systemForm;
      default: return accountForm;
    }
  };

  const setFormByTab = (tab: string, form: NotificationForm) => {
    switch (tab) {
      case 'account': setAccountForm(form); break;
      case 'product': setProductForm(form); break;
      case 'order': setOrderForm(form); break;
      case 'promotion': setPromoForm(form); break;
      case 'system': setSystemForm(form); break;
    }
  };

  return {
    forms: {
      account: accountForm,
      product: productForm,
      order: orderForm,
      promotion: promoForm,
      system: systemForm,
    },
    setters: {
      setAccountForm,
      setProductForm,
      setOrderForm,
      setPromoForm,
      setSystemForm,
    },
    resetForm,
    getFormByTab,
    setFormByTab,
  };
};