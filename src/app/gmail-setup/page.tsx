"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Mail, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle,
  Copy,
  RefreshCw
} from "lucide-react";

export default function GmailSetupPage() {
  const [step, setStep] = useState(1);
  const [refreshToken, setRefreshToken] = useState("");

  const handleStartOAuth = () => {
    window.open('/auth/gmail', '_blank');
    setStep(2);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Gmail API Setup</h1>
          <p className="text-muted-foreground">
            Get your Gmail refresh token for sending user approval emails
          </p>
        </div>

        {/* Current Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Current Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Gmail Client ID:</span>
                <Badge variant="outline">
                  {process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID ? 'Configured' : 'Missing'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Gmail Client Secret:</span>
                <Badge variant="outline">
                  {process.env.NEXT_PUBLIC_GMAIL_CLIENT_SECRET ? 'Configured' : 'Missing'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email From:</span>
                <span className="text-sm">benzochem.inds@gmail.com</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: OAuth Authorization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                1
              </span>
              Start OAuth Authorization
            </CardTitle>
            <CardDescription>
              Authorize your Gmail account to send emails via API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Make sure you sign in with <strong>benzochem.inds@gmail.com</strong> when prompted.
              </AlertDescription>
            </Alert>
            
            <Button onClick={handleStartOAuth} className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Start Gmail OAuth Authorization
            </Button>
            
            <p className="text-xs text-muted-foreground">
              This will open a new tab where you'll authorize Gmail API access.
            </p>
          </CardContent>
        </Card>

        {/* Step 2: Get Refresh Token */}
        {step >= 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                  2
                </span>
                Get Refresh Token
              </CardTitle>
              <CardDescription>
                After authorization, you'll receive a refresh token
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  After completing OAuth authorization, check the callback page for your refresh token.
                  Copy it and paste it in your .env.local file.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Refresh Token (from callback page):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="1//04abcdefghijklmnop..."
                    value={refreshToken}
                    onChange={(e) => setRefreshToken(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(refreshToken)}
                    disabled={!refreshToken}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {refreshToken && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Next steps:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Copy the refresh token above</li>
                      <li>Add it to your .env.local file as GMAIL_REFRESH_TOKEN</li>
                      <li>Restart your development server</li>
                      <li>Test the Gmail API endpoint</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Test Gmail API */}
        {refreshToken && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm bg-blue-500 text-white">
                  3
                </span>
                Test Gmail API
              </CardTitle>
              <CardDescription>
                Test sending emails via Gmail API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-md">
                <p className="text-sm font-medium mb-2">Test Command:</p>
                <code className="text-xs bg-white p-2 rounded block">
                  Test API endpoint manually
                </code>
              </div>
              
              <Button className="w-full" onClick={() => window.open('/api/gmail-send', '_blank')}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Test Gmail API Configuration
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-md">
              <p className="text-sm font-medium mb-2">Add to your .env.local file:</p>
              <pre className="text-xs bg-white p-2 rounded overflow-auto">
{`GMAIL_CLIENT_ID=991623205762-ispl3frv5ernarjdn4tdca5j7t5a1tfu.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=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
GMAIL_REFRESH_TOKEN=${refreshToken || 'your_refresh_token_here'}
EMAIL_FROM=benzochem.inds@gmail.com`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}