'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface NotificationForm {
  target: 'single' | 'multiple';
  tokens: string;
  title: string;
  body: string;
  data: string;
  imageUrl: string;
  clickAction: string;
  priority: 'normal' | 'high';
}

export function PushNotificationTester() {
  const [form, setForm] = useState<NotificationForm>({
    target: 'single',
    tokens: '',
    title: '',
    body: '',
    data: '{}',
    imageUrl: '',
    clickAction: '',
    priority: 'high',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let parsedData = {};
      if (form.data.trim()) {
        try {
          parsedData = JSON.parse(form.data);
        } catch (error) {
          toast.error('Invalid JSON in data field');
          setLoading(false);
          return;
        }
      }

      const tokens = form.tokens
        .split('\n')
        .map(token => token.trim())
        .filter(token => token.length > 0);

      if (tokens.length === 0) {
        toast.error('Please provide at least one FCM token');
        setLoading(false);
        return;
      }

      const payload = {
        target: form.target,
        tokens: tokens.length > 0 ? tokens : undefined,
        title: form.title,
        body: form.body,
        data: Object.keys(parsedData).length > 0 ? parsedData : undefined,
        imageUrl: form.imageUrl || undefined,
        clickAction: form.clickAction || undefined,
        priority: form.priority,
      };

      const response = await fetch('/api/notifications/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Notification sent successfully! ${result.message}`);
        // Reset form
        setForm({
          target: 'single',
          tokens: '',
          title: '',
          body: '',
          data: '{}',
          imageUrl: '',
          clickAction: '',
          priority: 'high',
        });
      } else {
        toast.error(`Failed to send notification: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setForm({
      ...form,
      title: 'Test Notification',
      body: 'This is a test push notification from Benzochem Industries admin panel.',
      data: JSON.stringify({
        type: 'test',
        timestamp: Date.now().toString(),
        action: 'test_notification',
      }, null, 2),
      priority: 'high',
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Push Notification Tester</CardTitle>
        <CardDescription>
          Send test push notifications to mobile devices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target">Target</Label>
            <Select
              value={form.target}
              onValueChange={(value: 'single' | 'multiple') =>
                setForm({ ...form, target: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Device</SelectItem>
                <SelectItem value="multiple">Multiple Devices</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tokens">FCM Tokens (one per line)</Label>
            <Textarea
              id="tokens"
              value={form.tokens}
              onChange={(e) => setForm({ ...form, tokens: e.target.value })}
              placeholder="Enter FCM tokens, one per line..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Notification title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Notification message"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data (JSON)</Label>
            <Textarea
              id="data"
              value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
              placeholder='{"key": "value"}'
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input
              id="imageUrl"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clickAction">Click Action (optional)</Label>
            <Input
              id="clickAction"
              value={form.clickAction}
              onChange={(e) => setForm({ ...form, clickAction: e.target.value })}
              placeholder="/dashboard or https://example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={form.priority}
              onValueChange={(value: 'normal' | 'high') =>
                setForm({ ...form, priority: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Sending...' : 'Send Notification'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={sendTestNotification}
              disabled={loading}
            >
              Fill Test Data
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
