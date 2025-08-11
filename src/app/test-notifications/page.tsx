import { PushNotificationTester } from '@/components/push-notification-tester';

export default function TestNotificationsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Push Notification Testing</h1>
        <p className="text-muted-foreground mt-2">
          Test Firebase push notifications to mobile devices
        </p>
      </div>
      
      <PushNotificationTester />
      
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Testing Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Ensure your mobile app is running and has generated an FCM token</li>
          <li>Copy the FCM token from the mobile app console logs</li>
          <li>Paste the token in the "FCM Tokens" field above</li>
          <li>Fill in the notification details</li>
          <li>Click "Send Notification" to test</li>
        </ol>
        
        <div className="mt-4">
          <h3 className="font-medium mb-1">Test Scenarios:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>App in foreground - should show alert dialog</li>
            <li>App in background - should show system notification</li>
            <li>App closed - should show notification and handle app launch</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
