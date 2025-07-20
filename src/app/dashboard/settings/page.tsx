"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Settings,
  Save,
  RefreshCw,
  Globe,
  Bell,
  Shield,
  Database,
  Mail,
  Key,
  Palette,
  Plus,
  Edit,
  Trash2
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const { admin } = useAuth();

  // Queries
  const settingsData = useQuery(api.settings?.getSettings);

  // Mutations
  const updateSetting = useMutation(api.settings?.updateSetting);
  const getOrCreateAdmin = useMutation(api.admins.getOrCreateAdmin);

  const handleUpdateSetting = async (key: string, value: any, category: string) => {
    if (!admin) return;

    try {
      const adminId = await getOrCreateAdmin({ email: admin.email });
      await updateSetting({
        key,
        value,
        category: category as any,
        adminId: adminId,
      });
      toast.success("Setting updated successfully");
      setIsEditing(null);
    } catch (error) {
      toast.error("Failed to update setting");
      console.error(error);
    }
  };

  // Settings configuration - static data for UI
  const settingsConfig = {
    general: [
      { key: "site_name", value: "Benzochem Industries", description: "Name of the website", type: "text" },
      { key: "site_description", value: "Leading chemical supplier", description: "Site description for SEO", type: "textarea" },
      { key: "contact_email", value: "admin@benzochem.com", description: "Primary contact email", type: "email" },
      { key: "maintenance_mode", value: false, description: "Enable maintenance mode", type: "boolean" },
      { key: "timezone", value: "UTC", description: "Default timezone", type: "select", options: ["UTC", "EST", "PST", "IST"] }
    ],
    api: [
      { key: "api_rate_limit", value: 1000, description: "API requests per hour", type: "number" },
      { key: "api_timeout", value: 30, description: "API timeout in seconds", type: "number" },
      { key: "enable_api_logging", value: true, description: "Log API requests", type: "boolean" },
      { key: "api_version", value: "v1", description: "Current API version", type: "text" }
    ],
    notifications: [
      { key: "email_notifications", value: true, description: "Enable email notifications", type: "boolean" },
      { key: "sms_notifications", value: false, description: "Enable SMS notifications", type: "boolean" },
      { key: "notification_retention", value: 30, description: "Days to keep notifications", type: "number" },
      { key: "admin_email_alerts", value: true, description: "Send alerts to admins", type: "boolean" }
    ],
    security: [
      { key: "password_min_length", value: 8, description: "Minimum password length", type: "number" },
      { key: "session_timeout", value: 24, description: "Session timeout in hours", type: "number" },
      { key: "enable_2fa", value: false, description: "Require two-factor authentication", type: "boolean" },
      { key: "max_login_attempts", value: 5, description: "Maximum login attempts", type: "number" }
    ],
    integrations: [
      { key: "payment_gateway", value: "stripe", description: "Payment gateway provider", type: "select", options: ["stripe", "paypal", "razorpay"] },
      { key: "analytics_tracking_id", value: "GA-XXXXXXXXX", description: "Google Analytics tracking ID", type: "text" },
      { key: "email_service", value: "sendgrid", description: "Email service provider", type: "select", options: ["sendgrid", "mailgun", "ses"] },
      { key: "sms_service", value: "twilio", description: "SMS service provider", type: "select", options: ["twilio", "nexmo", "aws_sns"] }
    ]
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "general":
        return <Globe className="h-4 w-4" />;
      case "api":
        return <Database className="h-4 w-4" />;
      case "notifications":
        return <Bell className="h-4 w-4" />;
      case "security":
        return <Shield className="h-4 w-4" />;
      case "integrations":
        return <Key className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const renderSettingInput = (setting: any, category: string) => {
    const isCurrentlyEditing = isEditing === `${category}.${setting.key}`;

    if (isCurrentlyEditing) {
      switch (setting.type) {
        case "boolean":
          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={editValue === "true"}
                onCheckedChange={(checked) => setEditValue(checked.toString())}
              />
              <Button size="sm" onClick={() => handleUpdateSetting(setting.key, editValue === "true", category)}>
                <Save className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(null)}>
                Cancel
              </Button>
            </div>
          );
        case "select":
          return (
            <div className="flex items-center gap-2">
              <Select value={editValue} onValueChange={setEditValue}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {setting.options?.map((option: string) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => handleUpdateSetting(setting.key, editValue, category)}>
                <Save className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(null)}>
                Cancel
              </Button>
            </div>
          );
        case "textarea":
          return (
            <div className="space-y-2">
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={3}
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => handleUpdateSetting(setting.key, editValue, category)}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          );
        default:
          return (
            <div className="flex items-center gap-2">
              <Input
                type={setting.type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-[200px]"
              />
              <Button size="sm" onClick={() => handleUpdateSetting(setting.key, editValue, category)}>
                <Save className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(null)}>
                Cancel
              </Button>
            </div>
          );
      }
    }

    // Display mode
    return (
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {setting.type === "boolean" ? (
            <Badge variant={setting.value ? "default" : "secondary"}>
              {setting.value ? "Enabled" : "Disabled"}
            </Badge>
          ) : (
            <span className="font-mono text-sm">{String(setting.value)}</span>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setIsEditing(`${category}.${setting.key}`);
            setEditValue(String(setting.value));
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <ProtectedRoute requiredPermission="settings.read">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
              <p className="text-muted-foreground">
                Configure system-wide settings and preferences
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </div>

          {/* Settings Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="api" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                API
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Integrations
              </TabsTrigger>
            </TabsList>

            {Object.entries(settingsConfig).map(([category, categorySettings]) => (
              <TabsContent key={category} value={category}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getCategoryIcon(category)}
                      {category.charAt(0).toUpperCase() + category.slice(1)} Settings
                    </CardTitle>
                    <CardDescription>
                      Configure {category} related settings and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {categorySettings.map((setting) => (
                        <div key={setting.key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm font-medium">
                                {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {setting.description}
                              </p>
                            </div>
                          </div>
                          {renderSettingInput(setting, category)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
