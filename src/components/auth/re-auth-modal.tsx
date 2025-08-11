"use client"

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Fingerprint, Lock, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface ReAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export function ReAuthModal({
  open,
  onOpenChange,
  onSuccess,
  onCancel,
  title = "Re-authenticate to Continue",
  description = "For security, please verify your identity to access sensitive information."
}: ReAuthModalProps) {
  const [activeTab, setActiveTab] = useState<'biometric' | 'password'>('biometric');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const { admin } = useAuth();
  const verifyPassword = useMutation(api.admins.verifyAdminPassword);

  // Check for WebAuthn/biometric support
  useEffect(() => {
    const checkBiometricSupport = async () => {
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setBiometricSupported(available);
          if (available) {
            setActiveTab('biometric');
          } else {
            setActiveTab('password');
          }
        } catch (error) {
          setBiometricSupported(false);
          setActiveTab('password');
        }
      } else {
        setBiometricSupported(false);
        setActiveTab('password');
      }
    };

    if (open) {
      checkBiometricSupport();
    }
  }, [open]);

  const handleBiometricAuth = async () => {
    if (!biometricSupported) {
      toast.error('Biometric authentication not supported');
      return;
    }

    setIsLoading(true);
    try {
      // Create a simple WebAuthn assertion for re-authentication
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new TextEncoder().encode('reauth-challenge-' + Date.now()),
          allowCredentials: [],
          userVerification: 'required',
          timeout: 60000,
        }
      });

      if (credential) {
        toast.success('Biometric authentication successful');
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error('Biometric authentication failed');
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error('Biometric authentication was cancelled');
      } else {
        toast.error('Biometric authentication failed. Please try password authentication.');
        setActiveTab('password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordAuth = async () => {
    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }

    if (!admin?.email) {
      toast.error('Admin email not found');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyPassword({
        email: admin.email,
        password: password.trim(),
      });

      if (!result.success) {
        toast.error(result.error || 'Invalid password');
        return;
      }

            toast.success('Password authentication successful');
      onSuccess();
      onOpenChange(false);
      setPassword('');
    } catch (error) {
      console.error('Password auth error:', error);
      toast.error('Invalid password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'biometric' | 'password')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="biometric" disabled={!biometricSupported}>
              <Fingerprint className="h-4 w-4 mr-2" />
              Biometric
            </TabsTrigger>
            <TabsTrigger value="password">
              <Lock className="h-4 w-4 mr-2" />
              Password
            </TabsTrigger>
          </TabsList>

          <TabsContent value="biometric" className="space-y-4">
            <div className="text-center py-6">
              <Fingerprint className="h-16 w-16 mx-auto text-blue-600 mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Use your device's biometric authentication to verify your identity.
              </p>
              <Button
                onClick={handleBiometricAuth}
                disabled={isLoading || !biometricSupported}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4 mr-2" />
                    Authenticate with Biometrics
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="password" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reauth-password">Admin Password</Label>
                <Input
                  id="reauth-password"
                  type="password"
                  placeholder="Enter your admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePasswordAuth();
                    }
                  }}
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handlePasswordAuth}
                disabled={isLoading || !password.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Verify Password
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
