import { ConvexHttpClient } from "convex/browser";
import { sendBulkPushNotifications } from './firebase-admin';
import { api } from "../../convex/_generated/api";

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export interface NotificationAction {
    id: string;
    title: string;
    action: 'navigate' | 'url' | 'call' | 'email' | 'custom';
    data?: {
        screen?: string;
        params?: any;
        url?: string;
        phone?: string;
        email?: string;
        customHandler?: string;
    };
}

export interface EnhancedNotificationData {
    title: string;
    body: string;
    category: 'account' | 'product' | 'order' | 'promotion' | 'system' | 'general';
    imageUrl?: string;
    actions?: NotificationAction[];
    data?: Record<string, any>;
    priority: 'high' | 'normal' | 'low';
    targetUsers?: string[]; // Specific user IDs
    targetSegments?: string[]; // User segments
    sendToAll?: boolean;
}

export class EnhancedNotificationSender {
    /**
     * Send account approval notification
     */
    static async sendAccountApprovalNotification(params: {
        userId: string;
        userEmail: string;
        userName: string;
        customMessage?: string;
    }) {
        const notification: EnhancedNotificationData = {
            title: '🎉 Account Approved!',
            body: params.customMessage || `Welcome ${params.userName}! Your account has been approved. Start exploring our products now!`,
            category: 'account',
            priority: 'high',
            actions: [
                {
                    id: 'view_products',
                    title: 'Browse Products',
                    action: 'navigate',
                    data: { screen: 'Products' }
                },
                {
                    id: 'contact_support',
                    title: 'Contact Support',
                    action: 'call',
                    data: { phone: '+1234567890' }
                }
            ],
            data: {
                userId: params.userId,
                userEmail: params.userEmail,
                approvedAt: Date.now(),
                notificationType: 'account_approved'
            },
            targetUsers: [params.userId, params.userEmail]
        };

        return await this.sendNotification(notification);
    }

    /**
     * Send account rejection notification
     */
    static async sendAccountRejectionNotification(params: {
        userId: string;
        userEmail: string;
        userName: string;
        rejectionReason: string;
    }) {
        const notification: EnhancedNotificationData = {
            title: '❌ Account Review Required',
            body: `Hi ${params.userName}, your account needs additional review. Reason: ${params.rejectionReason}`,
            category: 'account',
            priority: 'high',
            actions: [
                {
                    id: 'contact_support',
                    title: 'Contact Support',
                    action: 'call',
                    data: { phone: '+1234567890' }
                },
                {
                    id: 'resubmit',
                    title: 'Update Profile',
                    action: 'navigate',
                    data: { screen: 'Profile' }
                }
            ],
            data: {
                userId: params.userId,
                userEmail: params.userEmail,
                rejectionReason: params.rejectionReason,
                rejectedAt: Date.now(),
                notificationType: 'account_rejected'
            },
            targetUsers: [params.userId, params.userEmail]
        };

        return await this.sendNotification(notification);
    }

    /**
     * Send new product notification
     */
    static async sendNewProductNotification(params: {
        productId: string;
        productName: string;
        productImage?: string;
        category?: string;
        description?: string;
    }) {
        const notification: EnhancedNotificationData = {
            title: '🆕 New Product Available!',
            body: `Check out our latest addition: ${params.productName}. ${params.description || 'Now available in our inventory.'}`,
            category: 'product',
            priority: 'normal',
            imageUrl: params.productImage,
            actions: [
                {
                    id: 'view_product',
                    title: 'View Product',
                    action: 'navigate',
                    data: {
                        screen: 'ProductDetails',
                        params: { id: params.productId }
                    }
                },
                {
                    id: 'browse_category',
                    title: 'Browse Category',
                    action: 'navigate',
                    data: {
                        screen: 'Products',
                        params: { category: params.category }
                    }
                }
            ],
            data: {
                productId: params.productId,
                productName: params.productName,
                category: params.category,
                addedAt: Date.now(),
                notificationType: 'new_product'
            },
            sendToAll: true
        };

        return await this.sendNotification(notification);
    }

    /**
     * Send order update notification
     */
    static async sendOrderUpdateNotification(params: {
        userId: string;
        orderId: string;
        status: string;
        trackingNumber?: string;
        estimatedDelivery?: string;
    }) {
        const statusEmojis: Record<string, string> = {
            'confirmed': '✅',
            'processing': '⚙️',
            'shipped': '🚚',
            'delivered': '📦',
            'cancelled': '❌'
        };

        const statusMessages: Record<string, string> = {
            'confirmed': 'Your order has been confirmed and is being prepared.',
            'processing': 'Your order is being processed and will ship soon.',
            'shipped': 'Your order has been shipped and is on its way!',
            'delivered': 'Your order has been delivered successfully.',
            'cancelled': 'Your order has been cancelled.'
        };

        const notification: EnhancedNotificationData = {
            title: `${statusEmojis[params.status] || '📋'} Order Update`,
            body: `Order #${params.orderId}: ${statusMessages[params.status] || `Status updated to ${params.status}`}`,
            category: 'order',
            priority: 'high',
            actions: [
                {
                    id: 'view_order',
                    title: 'View Order',
                    action: 'navigate',
                    data: {
                        screen: 'OrderDetails',
                        params: { orderId: params.orderId }
                    }
                }
            ],
            data: {
                orderId: params.orderId,
                status: params.status,
                trackingNumber: params.trackingNumber,
                estimatedDelivery: params.estimatedDelivery,
                updatedAt: Date.now(),
                notificationType: 'order_update'
            },
            targetUsers: [params.userId]
        };

        // Add tracking action if shipped
        if (params.status === 'shipped' && params.trackingNumber) {
            notification.actions?.push({
                id: 'track_shipment',
                title: 'Track Shipment',
                action: 'url',
                data: { url: `https://tracking.example.com/${params.trackingNumber}` }
            });
        }

        return await this.sendNotification(notification);
    }

    /**
     * Send quotation update notification
     */
    static async sendQuotationUpdateNotification(params: {
        userId: string;
        quotationId: string;
        status: string;
        totalAmount?: string;
        validUntil?: string;
    }) {
        const statusEmojis: Record<string, string> = {
            'pending': '⏳',
            'processing': '⚙️',
            'quoted': '💰',
            'accepted': '✅',
            'rejected': '❌',
            'expired': '⏰'
        };

        const statusMessages: Record<string, string> = {
            'pending': 'Your quotation request has been received and is pending review.',
            'processing': 'Your quotation is being processed by our team.',
            'quoted': `Your quotation is ready! Total: ${params.totalAmount || 'TBD'}`,
            'accepted': 'Your quotation has been accepted. We will contact you soon.',
            'rejected': 'Your quotation request has been declined.',
            'expired': 'Your quotation has expired. Please request a new one.'
        };

        const notification: EnhancedNotificationData = {
            title: `${statusEmojis[params.status] || '📋'} Quotation Update`,
            body: `Quotation #${params.quotationId}: ${statusMessages[params.status]}`,
            category: 'order',
            priority: 'high',
            actions: [
                {
                    id: 'view_quotation',
                    title: 'View Quotation',
                    action: 'navigate',
                    data: {
                        screen: 'QuotationDetails',
                        params: { id: params.quotationId }
                    }
                }
            ],
            data: {
                quotationId: params.quotationId,
                status: params.status,
                totalAmount: params.totalAmount,
                validUntil: params.validUntil,
                updatedAt: Date.now(),
                notificationType: 'quotation_update'
            },
            targetUsers: [params.userId]
        };

        // Add contact action for quoted status
        if (params.status === 'quoted') {
            notification.actions?.push({
                id: 'contact_sales',
                title: 'Contact Sales',
                action: 'call',
                data: { phone: '+1234567890' }
            });
        }

        return await this.sendNotification(notification);
    }

    /**
     * Send promotional notification
     */
    static async sendPromotionalNotification(params: {
        title: string;
        message: string;
        promoCode?: string;
        discount?: number;
        validUntil?: string;
        imageUrl?: string;
        targetSegments?: string[];
    }) {
        const notification: EnhancedNotificationData = {
            title: `🎁 ${params.title}`,
            body: params.message,
            category: 'promotion',
            priority: 'normal',
            imageUrl: params.imageUrl,
            actions: [
                {
                    id: 'shop_now',
                    title: 'Shop Now',
                    action: 'navigate',
                    data: {
                        screen: 'Products',
                        params: {
                            promo: params.promoCode,
                            discount: params.discount
                        }
                    }
                },
                {
                    id: 'learn_more',
                    title: 'Learn More',
                    action: 'url',
                    data: { url: 'https://benzochem.com/promotions' }
                }
            ],
            data: {
                promoCode: params.promoCode,
                discount: params.discount,
                validUntil: params.validUntil,
                campaignId: `promo_${Date.now()}`,
                notificationType: 'promotion'
            },
            targetSegments: params.targetSegments,
            sendToAll: !params.targetSegments || params.targetSegments.length === 0
        };

        return await this.sendNotification(notification);
    }

    /**
     * Send system notification
     */
    static async sendSystemNotification(params: {
        title: string;
        message: string;
        type: 'maintenance' | 'update' | 'security' | 'general';
        actionUrl?: string;
        priority?: 'high' | 'normal' | 'low';
    }) {
        const typeEmojis: Record<string, string> = {
            'maintenance': '🔧',
            'update': '🆙',
            'security': '🔒',
            'general': 'ℹ️'
        };

        const notification: EnhancedNotificationData = {
            title: `${typeEmojis[params.type]} ${params.title}`,
            body: params.message,
            category: 'system',
            priority: params.priority || 'normal',
            actions: [
                {
                    id: 'learn_more',
                    title: 'Learn More',
                    action: 'url',
                    data: { url: params.actionUrl || 'https://benzochem.com/updates' }
                }
            ],
            data: {
                systemType: params.type,
                timestamp: Date.now(),
                notificationType: 'system_notification'
            },
            sendToAll: true
        };

        return await this.sendNotification(notification);
    }

    /**
     * Core notification sending method
     */
    private static async sendNotification(notificationData: EnhancedNotificationData) {
        try {
            console.log('📤 Sending enhanced notification:', notificationData.title);

            // Get target FCM tokens
            const tokens = await this.getTargetTokens(notificationData);

            if (tokens.length === 0) {
                throw new Error('No target tokens found');
            }

            console.log(`📱 Sending to ${tokens.length} devices`);

            // Prepare Firebase message
            const firebaseMessage = {
                tokens,
                title: notificationData.title,
                body: notificationData.body,
                data: {
                    category: notificationData.category,
                    priority: notificationData.priority,
                    actions: JSON.stringify(notificationData.actions || []),
                    customData: JSON.stringify(notificationData.data || {}),
                    imageUrl: notificationData.imageUrl || '',
                    notificationId: `notif_${Date.now()}`
                },
                imageUrl: notificationData.imageUrl,
                android: {
                    priority: (notificationData.priority === 'high' ? 'high' : 'normal') as 'high' | 'normal',
                    notification: {
                        channelId: `benzochem_${notificationData.category}`,
                        priority: (notificationData.priority === 'high' ? 'high' : 'default') as 'high' | 'low' | 'default' | 'min' | 'max',
                        defaultSound: true,
                        defaultVibrateTimings: true,
                        color: this.getCategoryColor(notificationData.category),
                        icon: 'ic_notification'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            alert: {
                                title: notificationData.title,
                                body: notificationData.body
                            },
                            sound: 'default',
                            badge: 1,
                            category: notificationData.category,
                            'mutable-content': 1
                        }
                    }
                }
            };

            // Send via Firebase
            const result = await sendBulkPushNotifications(firebaseMessage);

            // Log to Convex
            await this.logNotificationToConvex({
                ...notificationData,
                tokens: tokens.length,
                result,
                sentAt: Date.now()
            });

            console.log('✅ Enhanced notification sent successfully');
            return {
                success: true,
                tokensCount: tokens.length,
                result
            };

        } catch (error) {
            console.error('❌ Failed to send enhanced notification:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Get target FCM tokens based on notification criteria
     */
    private static async getTargetTokens(notificationData: EnhancedNotificationData): Promise<string[]> {
        try {
            console.log('🎯 Getting target tokens for notification:', {
                sendToAll: notificationData.sendToAll,
                targetUsers: notificationData.targetUsers,
                targetSegments: notificationData.targetSegments
            });

            // Get all active FCM tokens
            const activeTokens = await convex.query(api.notifications.getAllActiveFCMTokens);
            console.log(`📱 Found ${activeTokens.length} active FCM tokens`);

            // Send to all users
            if (notificationData.sendToAll) {
                console.log('📢 Sending to all users');
                return activeTokens.map((token: any) => token.token);
            }

            // Send to specific users by userId
            if (notificationData.targetUsers && notificationData.targetUsers.length > 0) {
                console.log('👤 Filtering tokens for specific users:', notificationData.targetUsers);
                
                const filteredTokens = activeTokens.filter((token: any) => {
                    // Check both userId and userEmail for matching
                    const matchesUserId = token.userId && notificationData.targetUsers!.includes(token.userId);
                    const matchesUserEmail = token.userEmail && notificationData.targetUsers!.includes(token.userEmail);
                    
                    if (matchesUserId || matchesUserEmail) {
                        console.log('✅ Token matched for user:', {
                            tokenUserId: token.userId,
                            tokenUserEmail: token.userEmail,
                            targetUsers: notificationData.targetUsers
                        });
                        return true;
                    }
                    return false;
                });

                console.log(`🎯 Found ${filteredTokens.length} matching tokens for target users`);
                
                if (filteredTokens.length === 0) {
                    console.warn('⚠️ No FCM tokens found for target users. This could mean:');
                    console.warn('   - User has not logged into mobile app');
                    console.warn('   - User has not granted notification permissions');
                    console.warn('   - FCM token registration failed');
                    console.warn('   - User ID mismatch between admin and mobile app');
                }

                return filteredTokens.map((token: any) => token.token);
            }

            // Send to specific segments
            if (notificationData.targetSegments && notificationData.targetSegments.length > 0) {
                console.log('🏷️ Segment-based targeting not yet implemented');
                console.log('📢 Falling back to sending to all users for segments:', notificationData.targetSegments);
                
                // TODO: Implement segment-based user filtering
                // For now, send to all users when segments are specified
                return activeTokens.map((token: any) => token.token);
            }

            console.log('❌ No targeting criteria specified');
            return [];
        } catch (error) {
            console.error('❌ Error getting target tokens:', error);
            return [];
        }
    }

    /**
     * Get category color for Android notifications
     */
    private static getCategoryColor(category: string): string {
        const colors: Record<string, string> = {
            'account': '#4CAF50',
            'product': '#2196F3',
            'order': '#FF9800',
            'promotion': '#E91E63',
            'system': '#9C27B0',
            'general': '#607D8B'
        };
        return colors[category] || colors.general;
    }

    /**
     * Log notification to Convex for analytics
     */
    private static async logNotificationToConvex(data: any) {
        try {
            await convex.mutation(api.notifications.logPushNotification, {
                target: data.targetUsers ? `users: ${data.targetUsers.join(', ')}` : 'all_users',
                title: data.title,
                body: data.body,
                data: {
                    category: data.category,
                    priority: data.priority,
                    tokensCount: data.tokens,
                    customData: data.data || {}
                },
                result: {
                    success: data.result?.success || false,
                    message: data.result?.message || 'Notification sent',
                    successCount: data.result?.successCount || data.tokens,
                    failureCount: data.result?.failureCount || 0
                },
                sentAt: data.sentAt
            });
        } catch (error) {
            console.error('Error logging notification to Convex:', error);
        }
    }
}

export default EnhancedNotificationSender;