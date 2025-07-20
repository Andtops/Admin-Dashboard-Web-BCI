"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCookieConsent } from '@/contexts/cookie-consent-context';
import { useAuthCookieIntegration } from '@/lib/auth-cookie-integration';
import { Cookie, User, UserX, Link, CheckCircle, XCircle } from 'lucide-react';

/**
 * Example component demonstrating the cookie consent system
 * Shows how to use the context and handle anonymous-to-user flow
 */
export default function CookieConsentExample() {
  const {
    hasConsent,
    preferences,
    isLoading,
    isAnonymousUser,
    anonymousId,
    consentData,
    saveConsent,
    clearConsent,
    linkAnonymousConsent,
  } = useCookieConsent();

  const { handleRegistration, handleLogin } = useAuthCookieIntegration();

  // Simulate user registration
  const simulateRegistration = async () => {
    const mockUser = {
      id: `user_${Date.now()}`,
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    const result = await handleRegistration(mockUser);
    console.log('Registration result:', result);
  };

  // Simulate user login
  const simulateLogin = async () => {
    const mockUser = {
      id: `user_${Date.now()}`,
      email: 'jane.smith@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    const result = await handleLogin(mockUser);
    console.log('Login result:', result);
  };

  // Set sample consent
  const setSampleConsent = async () => {
    await saveConsent({
      essential: true,
      analytics: true,
      marketing: false,
      functional: true,
    }, 'banner_custom');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading consent status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            Cookie Consent System Demo
          </CardTitle>
          <CardDescription>
            Demonstrates the anonymous-to-user cookie consent flow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                {isAnonymousUser ? <UserX className="h-4 w-4" /> : <User className="h-4 w-4" />}
                User Status
              </h4>
              <div className="space-y-2">
                <Badge variant={isAnonymousUser ? "secondary" : "default"}>
                  {isAnonymousUser ? "Anonymous User" : "Registered User"}
                </Badge>
                {isAnonymousUser && anonymousId && (
                  <p className="text-xs text-muted-foreground font-mono">
                    ID: {anonymousId.substring(0, 20)}...
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Cookie className="h-4 w-4" />
                Consent Status
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {hasConsent ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Consent Given</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">No Consent</span>
                    </>
                  )}
                </div>
                {consentData && (
                  <p className="text-xs text-muted-foreground">
                    Method: {consentData.consentMethod.replace('_', ' ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Preferences Display */}
          {hasConsent && preferences && (
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-3">Current Preferences</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">Essential</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">Analytics</span>
                  {preferences.analytics ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">Marketing</span>
                  {preferences.marketing ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">Functional</span>
                  {preferences.functional ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <h4 className="font-medium">Test Actions</h4>
            
            <div className="flex flex-wrap gap-2">
              {!hasConsent && (
                <Button onClick={setSampleConsent} variant="default">
                  Set Sample Consent
                </Button>
              )}
              
              {hasConsent && (
                <Button onClick={clearConsent} variant="outline">
                  Clear Consent
                </Button>
              )}

              {isAnonymousUser && hasConsent && (
                <>
                  <Button onClick={simulateRegistration} variant="secondary">
                    <User className="h-4 w-4 mr-2" />
                    Simulate Registration
                  </Button>
                  <Button onClick={simulateLogin} variant="secondary">
                    <Link className="h-4 w-4 mr-2" />
                    Simulate Login
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Flow Explanation */}
          <div className="p-4 bg-muted/30 rounded-lg border">
            <h4 className="font-medium mb-2">How it Works</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Anonymous users get a unique ID and can set cookie preferences</li>
              <li>When they register or login, their anonymous consent is automatically linked</li>
              <li>No need to re-consent - preferences are preserved seamlessly</li>
              <li>All data is stored server-side for GDPR compliance</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}