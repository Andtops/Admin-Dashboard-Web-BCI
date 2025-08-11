"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Settings,
  Bell,
  Shield,
  Clock,
  Users,
  Smartphone,
  Mail,
  Key,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Upload,
  Download
} from "lucide-react";

interface NotificationSettingsProps {
  settings: {
    firebase: {
      projectId: string;
      privateKey: string;
      clientEmail: string;
      isConfigured: boolean;
    };
    general: {
      enablePushNotifications: boolean;
      enableEmailNotifications: boolean;
      defaultSendTime: string;
      maxNotificationsPerDay: number;
      quietHoursStart: string;
      quietHoursEnd: string;
    };
    templates: {
      orderUpdate: string;
      promotion: string;
      systemAlert: string;
      welcome: string;
    };
    targeting: {
      enableGeolocation: boolean;
      enableBehavioralTargeting: boolean;
      enableSegmentation: boolean;
      retentionDays: number;
    };
  };
  onUpdateSettings: (section: string, updates: any) => void;
}

export function NotificationSettings({ settings, onUpdateSettings }: NotificationSettingsProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSave = async (section: string, data: any) => {
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      await onUpdateSettings(section, data);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const getSaveButtonContent = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        );
      case 'saved':
        return (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Saved
          </>
        );
      case 'error':
        return (
          <>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Error
          </>
        );
      default:
        return (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Settings</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configure push notification system settings and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Config
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import Config
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="firebase">Firebase</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="targeting">Targeting</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Configure basic notification system preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable Push Notifications</Label>
                    <div className="text-sm text-gray-500">
                      Allow sending push notifications to mobile devices
                    </div>
                  </div>
                  <Switch
                    checked={settings.general.enablePushNotifications}
                    onCheckedChange={(checked) => 
                      onUpdateSettings('general', { ...settings.general, enablePushNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable Email Notifications</Label>
                    <div className="text-sm text-gray-500">
                      Allow sending email notifications as fallback
                    </div>
                  </div>
                  <Switch
                    checked={settings.general.enableEmailNotifications}
                    onCheckedChange={(checked) => 
                      onUpdateSettings('general', { ...settings.general, enableEmailNotifications: checked })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultSendTime">Default Send Time</Label>
                    <Input
                      id="defaultSendTime"
                      type="time"
                      value={settings.general.defaultSendTime}
                      onChange={(e) => 
                        onUpdateSettings('general', { ...settings.general, defaultSendTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxNotifications">Max Notifications/Day</Label>
                    <Input
                      id="maxNotifications"
                      type="number"
                      min="1"
                      max="50"
                      value={settings.general.maxNotificationsPerDay}
                      onChange={(e) => 
                        onUpdateSettings('general', { ...settings.general, maxNotificationsPerDay: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base">Quiet Hours</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quietStart">Start Time</Label>
                      <Input
                        id="quietStart"
                        type="time"
                        value={settings.general.quietHoursStart}
                        onChange={(e) => 
                          onUpdateSettings('general', { ...settings.general, quietHoursStart: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quietEnd">End Time</Label>
                      <Input
                        id="quietEnd"
                        type="time"
                        value={settings.general.quietHoursEnd}
                        onChange={(e) => 
                          onUpdateSettings('general', { ...settings.general, quietHoursEnd: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Notifications will not be sent during quiet hours (user's local time)
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSave('general', settings.general)}
                  disabled={isSaving}
                >
                  {getSaveButtonContent()}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="firebase" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Firebase Configuration
              </CardTitle>
              <CardDescription>
                Configure Firebase Cloud Messaging settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                {settings.firebase.isConfigured ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-700 dark:text-green-400">Firebase is properly configured</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-yellow-700 dark:text-yellow-400">Firebase configuration required</span>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project ID</Label>
                  <Input
                    id="projectId"
                    value={settings.firebase.projectId}
                    onChange={(e) => 
                      onUpdateSettings('firebase', { ...settings.firebase, projectId: e.target.value })
                    }
                    placeholder="your-firebase-project-id"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={settings.firebase.clientEmail}
                    onChange={(e) => 
                      onUpdateSettings('firebase', { ...settings.firebase, clientEmail: e.target.value })
                    }
                    placeholder="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="privateKey">Private Key</Label>
                  <Textarea
                    id="privateKey"
                    value={settings.firebase.privateKey}
                    onChange={(e) => 
                      onUpdateSettings('firebase', { ...settings.firebase, privateKey: e.target.value })
                    }
                    placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <div className="text-sm text-gray-500">
                    Keep this secure and never share it publicly
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline">
                  Test Connection
                </Button>
                <Button 
                  onClick={() => handleSave('firebase', settings.firebase)}
                  disabled={isSaving}
                >
                  {getSaveButtonContent()}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Notification Templates
              </CardTitle>
              <CardDescription>
                Configure default templates for different notification types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="orderTemplate">Order Update Template</Label>
                  <Textarea
                    id="orderTemplate"
                    value={settings.templates.orderUpdate}
                    onChange={(e) => 
                      onUpdateSettings('templates', { ...settings.templates, orderUpdate: e.target.value })
                    }
                    placeholder="Your order #{orderId} has been {status}"
                    rows={2}
                  />
                  <div className="text-sm text-gray-500">
                    Available variables: {'{orderId}'}, {'{status}'}, {'{customerName}'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promotionTemplate">Promotion Template</Label>
                  <Textarea
                    id="promotionTemplate"
                    value={settings.templates.promotion}
                    onChange={(e) => 
                      onUpdateSettings('templates', { ...settings.templates, promotion: e.target.value })
                    }
                    placeholder="🎉 Special offer: {discount}% off on {productCategory}!"
                    rows={2}
                  />
                  <div className="text-sm text-gray-500">
                    Available variables: {'{discount}'}, {'{productCategory}'}, {'{validUntil}'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="systemTemplate">System Alert Template</Label>
                  <Textarea
                    id="systemTemplate"
                    value={settings.templates.systemAlert}
                    onChange={(e) => 
                      onUpdateSettings('templates', { ...settings.templates, systemAlert: e.target.value })
                    }
                    placeholder="System notification: {message}"
                    rows={2}
                  />
                  <div className="text-sm text-gray-500">
                    Available variables: {'{message}'}, {'{severity}'}, {'{timestamp}'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcomeTemplate">Welcome Template</Label>
                  <Textarea
                    id="welcomeTemplate"
                    value={settings.templates.welcome}
                    onChange={(e) => 
                      onUpdateSettings('templates', { ...settings.templates, welcome: e.target.value })
                    }
                    placeholder="Welcome to BenzoChem Industries, {customerName}!"
                    rows={2}
                  />
                  <div className="text-sm text-gray-500">
                    Available variables: {'{customerName}'}, {'{companyName}'}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSave('templates', settings.templates)}
                  disabled={isSaving}
                >
                  {getSaveButtonContent()}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="targeting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Targeting & Segmentation
              </CardTitle>
              <CardDescription>
                Configure user targeting and segmentation options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable Geolocation Targeting</Label>
                    <div className="text-sm text-gray-500">
                      Target users based on their geographic location
                    </div>
                  </div>
                  <Switch
                    checked={settings.targeting.enableGeolocation}
                    onCheckedChange={(checked) => 
                      onUpdateSettings('targeting', { ...settings.targeting, enableGeolocation: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable Behavioral Targeting</Label>
                    <div className="text-sm text-gray-500">
                      Target users based on their app usage patterns
                    </div>
                  </div>
                  <Switch
                    checked={settings.targeting.enableBehavioralTargeting}
                    onCheckedChange={(checked) => 
                      onUpdateSettings('targeting', { ...settings.targeting, enableBehavioralTargeting: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable User Segmentation</Label>
                    <div className="text-sm text-gray-500">
                      Create and target specific user segments
                    </div>
                  </div>
                  <Switch
                    checked={settings.targeting.enableSegmentation}
                    onCheckedChange={(checked) => 
                      onUpdateSettings('targeting', { ...settings.targeting, enableSegmentation: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retentionDays">Data Retention (Days)</Label>
                  <Input
                    id="retentionDays"
                    type="number"
                    min="30"
                    max="365"
                    value={settings.targeting.retentionDays}
                    onChange={(e) => 
                      onUpdateSettings('targeting', { ...settings.targeting, retentionDays: parseInt(e.target.value) })
                    }
                  />
                  <div className="text-sm text-gray-500">
                    How long to keep user behavior data for targeting
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSave('targeting', settings.targeting)}
                  disabled={isSaving}
                >
                  {getSaveButtonContent()}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
