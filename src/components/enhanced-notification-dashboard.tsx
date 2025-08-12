'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Send, 
  User, 
  Package, 
  ShoppingCart, 
  Gift, 
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface NotificationForm {
  type: string;
  title: string;
  message: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  productId?: string;
  productName?: string;
  orderId?: string;
  quotationId?: string;
  promoCode?: string;
  discount?: number;
  imageUrl?: string;
  actionUrl?: string;
  priority: 'high' | 'normal' | 'low';
  customMessage?: string;
  rejectionReason?: string;
}

const EnhancedNotificationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  
  const [accountForm, setAccountForm] = useState<NotificationForm>({
    type: 'account_approval',
    title: '',
    message: '',
    userId: '',
    userEmail: '',
    userName: '',
    priority: 'high'
  });

  const [productForm, setProductForm] = useState<NotificationForm>({
    type: 'new_product',
    title: '',
    message: '',
    productId: '',
    productName: '',
    imageUrl: '',
    priority: 'normal'
  });

  const [orderForm, setOrderForm] = useState<NotificationForm>({
    type: 'order_update',
    title: '',
    message: '',
    userId: '',
    orderId: '',
    priority: 'high'
  });

  const [promoForm, setPromoForm] = useState<NotificationForm>({
    type: 'promotion',
    title: '',
    message: '',
    promoCode: '',
    discount: 0,
    imageUrl: '',
    priority: 'normal'
  });

  const [systemForm, setSystemForm] = useState<NotificationForm>({
    type: 'system',
    title: '',
    message: '',
    actionUrl: '',
    priority: 'normal'
  });

  const sendNotification = async (formData: NotificationForm) => {
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

      const result = await response.json();
      setLastResult(result);

      if (result.success) {
        // Reset form on success
        resetForm(activeTab);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setLastResult({
        success: false,
        error: 'Failed to send notification'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = (tab: string) => {
    switch (tab) {
      case 'account':
        setAccountForm({
          type: 'account_approval',
          title: '',
          message: '',
          userId: '',
          userEmail: '',
          userName: '',
          priority: 'high'
        });
        break;
      case 'product':
        setProductForm({
          type: 'new_product',
          title: '',
          message: '',
          productId: '',
          productName: '',
          imageUrl: '',
          priority: 'normal'
        });
        break;
      case 'order':
        setOrderForm({
          type: 'order_update',
          title: '',
          message: '',
          userId: '',
          orderId: '',
          priority: 'high'
        });
        break;
      case 'promotion':
        setPromoForm({
          type: 'promotion',
          title: '',
          message: '',
          promoCode: '',
          discount: 0,
          imageUrl: '',
          priority: 'normal'
        });
        break;
      case 'system':
        setSystemForm({
          type: 'system',
          title: '',
          message: '',
          actionUrl: '',
          priority: 'normal'
        });
        break;
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'account': return <User className="w-4 h-4" />;
      case 'product': return <Package className="w-4 h-4" />;
      case 'order': return <ShoppingCart className="w-4 h-4" />;
      case 'promotion': return <Gift className="w-4 h-4" />;
      case 'system': return <Settings className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const renderResultBadge = () => {
    if (!lastResult) return null;

    if (lastResult.success) {
      return (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Notification sent successfully!
            </p>
            {lastResult.data?.tokensCount && (
              <p className="text-xs text-green-600">
                Delivered to {lastResult.data.tokensCount} devices
              </p>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Failed to send notification
            </p>
            <p className="text-xs text-red-600">
              {lastResult.error}
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Enhanced Notification Center</h2>
        <Badge variant="secondary">With Action Buttons</Badge>
      </div>

      {renderResultBadge()}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="account" className="flex items-center gap-2">
            {getTabIcon('account')}
            Account
          </TabsTrigger>
          <TabsTrigger value="product" className="flex items-center gap-2">
            {getTabIcon('product')}
            Product
          </TabsTrigger>
          <TabsTrigger value="order" className="flex items-center gap-2">
            {getTabIcon('order')}
            Order
          </TabsTrigger>
          <TabsTrigger value="promotion" className="flex items-center gap-2">
            {getTabIcon('promotion')}
            Promotion
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            {getTabIcon('system')}
            System
          </TabsTrigger>
        </TabsList>

        {/* Account Notifications */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Notification Type</label>
                  <Select 
                    value={accountForm.type} 
                    onValueChange={(value) => setAccountForm({...accountForm, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account_approval">Account Approved</SelectItem>
                      <SelectItem value="account_rejection">Account Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select 
                    value={accountForm.priority} 
                    onValueChange={(value: any) => setAccountForm({...accountForm, priority: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  placeholder="User ID"
                  value={accountForm.userId}
                  onChange={(e) => setAccountForm({...accountForm, userId: e.target.value})}
                />
                <Input
                  placeholder="User Email"
                  value={accountForm.userEmail}
                  onChange={(e) => setAccountForm({...accountForm, userEmail: e.target.value})}
                />
                <Input
                  placeholder="User Name"
                  value={accountForm.userName}
                  onChange={(e) => setAccountForm({...accountForm, userName: e.target.value})}
                />
              </div>

              {accountForm.type === 'account_rejection' && (
                <Textarea
                  placeholder="Rejection reason..."
                  value={accountForm.rejectionReason || ''}
                  onChange={(e) => setAccountForm({...accountForm, rejectionReason: e.target.value})}
                />
              )}

              <Textarea
                placeholder="Custom message (optional)..."
                value={accountForm.customMessage || ''}
                onChange={(e) => setAccountForm({...accountForm, customMessage: e.target.value})}
              />

              <Button 
                onClick={() => sendNotification(accountForm)} 
                disabled={isLoading || !accountForm.userId}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Account Notification
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Notifications */}
        <TabsContent value="product">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Product Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Product ID"
                  value={productForm.productId}
                  onChange={(e) => setProductForm({...productForm, productId: e.target.value})}
                />
                <Input
                  placeholder="Product Name"
                  value={productForm.productName}
                  onChange={(e) => setProductForm({...productForm, productName: e.target.value})}
                />
              </div>

              <Input
                placeholder="Product Image URL (optional)"
                value={productForm.imageUrl}
                onChange={(e) => setProductForm({...productForm, imageUrl: e.target.value})}
              />

              <Textarea
                placeholder="Product description..."
                value={productForm.message}
                onChange={(e) => setProductForm({...productForm, message: e.target.value})}
              />

              <Button 
                onClick={() => sendNotification(productForm)} 
                disabled={isLoading || !productForm.productId || !productForm.productName}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send to All Users
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order Notifications */}
        <TabsContent value="order">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Order & Quotation Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select 
                    value={orderForm.type} 
                    onValueChange={(value) => setOrderForm({...orderForm, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order_update">Order Update</SelectItem>
                      <SelectItem value="quotation_update">Quotation Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="User ID"
                  value={orderForm.userId}
                  onChange={(e) => setOrderForm({...orderForm, userId: e.target.value})}
                />
              </div>

              <Input
                placeholder={orderForm.type === 'quotation_update' ? 'Quotation ID' : 'Order ID'}
                value={orderForm.type === 'quotation_update' ? orderForm.quotationId : orderForm.orderId}
                onChange={(e) => setOrderForm({
                  ...orderForm, 
                  [orderForm.type === 'quotation_update' ? 'quotationId' : 'orderId']: e.target.value
                })}
              />

              <Input
                placeholder="Status (confirmed, processing, shipped, delivered, etc.)"
                value={orderForm.message}
                onChange={(e) => setOrderForm({...orderForm, message: e.target.value})}
              />

              <Button 
                onClick={() => sendNotification(orderForm)} 
                disabled={isLoading || !orderForm.userId}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Order Update
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promotion Notifications */}
        <TabsContent value="promotion">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Promotional Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Promotion Title"
                  value={promoForm.title}
                  onChange={(e) => setPromoForm({...promoForm, title: e.target.value})}
                />
                <Input
                  placeholder="Promo Code"
                  value={promoForm.promoCode}
                  onChange={(e) => setPromoForm({...promoForm, promoCode: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Discount %"
                  value={promoForm.discount}
                  onChange={(e) => setPromoForm({...promoForm, discount: parseInt(e.target.value) || 0})}
                />
                <Input
                  placeholder="Image URL (optional)"
                  value={promoForm.imageUrl}
                  onChange={(e) => setPromoForm({...promoForm, imageUrl: e.target.value})}
                />
              </div>

              <Textarea
                placeholder="Promotion message..."
                value={promoForm.message}
                onChange={(e) => setPromoForm({...promoForm, message: e.target.value})}
              />

              <Button 
                onClick={() => sendNotification(promoForm)} 
                disabled={isLoading || !promoForm.title || !promoForm.message}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send to All Users
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Notifications */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="System Title"
                  value={systemForm.title}
                  onChange={(e) => setSystemForm({...systemForm, title: e.target.value})}
                />
                <Select 
                  value={systemForm.type || 'general'} 
                  onValueChange={(value) => setSystemForm({...systemForm, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                placeholder="Action URL (optional)"
                value={systemForm.actionUrl}
                onChange={(e) => setSystemForm({...systemForm, actionUrl: e.target.value})}
              />

              <Textarea
                placeholder="System message..."
                value={systemForm.message}
                onChange={(e) => setSystemForm({...systemForm, message: e.target.value})}
              />

              <Button 
                onClick={() => sendNotification(systemForm)} 
                disabled={isLoading || !systemForm.title || !systemForm.message}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send to All Users
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedNotificationDashboard;