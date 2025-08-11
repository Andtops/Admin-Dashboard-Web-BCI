"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Send, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Copy,
  Smartphone,
  Bell
} from "lucide-react";

export function NotificationTestPanel() {
  const [testData, setTestData] = useState({
    token: '',
    title: 'Test Notification',
    body: 'This is a test notification from BenzoChem Industries Admin Dashboard',
    category: 'test',
    actionUrl: 'benzochem://notifications'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSendTest = async () => {
    if (!testData.token.trim()) {
      setResult({
        success: false,
        error: 'FCM token is required'
      });
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: testData.token,
          title: testData.title,
          body: testData.body,
          data: {
            category: testData.category,
            actionUrl: testData.actionUrl,
            customData: JSON.stringify({ 
              test: true, 
              timestamp: new Date().toISOString() 
            })
          }
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyExampleToken = () => {
    const exampleToken = "dGVzdF90b2tlbl9leGFtcGxlXzEyMzQ1Njc4OTA";
    setTestData(prev => ({ ...prev, token: exampleToken }));
    navigator.clipboard.writeText(exampleToken);
  };

  const getResultIcon = () => {
    if (!result) return null;
    if (result.success) return <CheckCircle className="h-5 w-5 text-green-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getResultColor = () => {
    if (!result) return '';
    return result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-blue-600" />
          <CardTitle>Push Notification Test</CardTitle>
        </div>
        <CardDescription>
          Test push notifications by sending them directly to a device token
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Token Input */}
        <div className="space-y-2">
          <Label htmlFor="token">FCM Device Token</Label>
          <div className="flex gap-2">
            <Input
              id="token"
              placeholder="Enter FCM token from mobile app console..."
              value={testData.token}
              onChange={(e) => setTestData(prev => ({ ...prev, token: e.target.value }))}
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={copyExampleToken}
              className="shrink-0"
            >
              <Copy className="h-4 w-4 mr-1" />
              Example
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Get the FCM token from the mobile app console logs when it starts up
          </p>
        </div>

        {/* Notification Content */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Notification Title</Label>
            <Input
              id="title"
              value={testData.title}
              onChange={(e) => setTestData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={testData.category}
              onChange={(e) => setTestData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="test">Test</option>
              <option value="order">Order</option>
              <option value="promotion">Promotion</option>
              <option value="system">System</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Message Body</Label>
          <Textarea
            id="body"
            value={testData.body}
            onChange={(e) => setTestData(prev => ({ ...prev, body: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="actionUrl">Action URL (Optional)</Label>
          <Input
            id="actionUrl"
            placeholder="benzochem://notifications"
            value={testData.actionUrl}
            onChange={(e) => setTestData(prev => ({ ...prev, actionUrl: e.target.value }))}
          />
        </div>

        {/* Send Button */}
        <Button 
          onClick={handleSendTest} 
          disabled={loading || !testData.token.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Sending Test...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Test Notification
            </>
          )}
        </Button>

        {/* Result Display */}
        {result && (
          <Alert className={getResultColor()}>
            <div className="flex items-start gap-2">
              {getResultIcon()}
              <div className="flex-1">
                <AlertDescription>
                  {result.success ? (
                    <div className="space-y-2">
                      <div className="font-medium text-green-800">
                        ✅ Test notification sent successfully!
                      </div>
                      {result.messageId && (
                        <div className="text-sm text-green-700">
                          Message ID: <code className="bg-green-100 px-1 rounded">{result.messageId}</code>
                        </div>
                      )}
                      <div className="text-sm text-green-700">
                        Check your mobile device for the notification.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="font-medium text-red-800">
                        ❌ Failed to send test notification
                      </div>
                      <div className="text-sm text-red-700">
                        Error: {result.error}
                      </div>
                      {result.details && (
                        <div className="text-xs text-red-600">
                          Details: {result.details}
                        </div>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900">How to Test:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Open the BenzoChem Industries mobile app</li>
                <li>Check the console logs for the FCM token (starts with "🔥 FCM TOKEN FOR TESTING 🔥")</li>
                <li>Copy the token and paste it in the field above</li>
                <li>Customize the notification content if desired</li>
                <li>Click "Send Test Notification"</li>
                <li>Check your mobile device for the notification</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Mobile App Required</span>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Firebase Configured</span>
            <Badge variant="outline" className="text-xs">
              {process.env.NODE_ENV === 'development' ? 'Dev Mode' : 'Production'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
