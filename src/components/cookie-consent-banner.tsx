"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Cookie, 
  Settings, 
  X, 
  Shield, 
  BarChart3, 
  Target, 
  Zap,
  ChevronDown,
  ChevronUp,
  UserX,
  User
} from 'lucide-react';
import { useCookieConsent, type CookiePreferences } from '@/contexts/cookie-consent-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CookieConsentBannerProps {
  onConsentChange?: (preferences: CookiePreferences) => void;
  className?: string;
}

export default function CookieConsentBanner({ onConsentChange, className }: CookieConsentBannerProps) {
  const { 
    hasConsent, 
    isLoading, 
    saveConsent, 
    isAnonymousUser,
    anonymousId 
  } = useCookieConsent();
  
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    functional: false,
  });

  // Show banner if no consent and not loading
  useEffect(() => {
    if (!isLoading && !hasConsent) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [hasConsent, isLoading]);

  const handleAcceptAll = async () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    
    const success = await saveConsent(allAccepted, 'banner_accept_all');
    if (success) {
      setIsVisible(false);
      onConsentChange?.(allAccepted);
    }
  };

  const handleAcceptEssential = async () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    
    const success = await saveConsent(essentialOnly, 'banner_essential_only');
    if (success) {
      setIsVisible(false);
      onConsentChange?.(essentialOnly);
    }
  };

  const handleCustomSave = async () => {
    const success = await saveConsent(preferences, 'banner_custom');
    if (success) {
      setIsVisible(false);
      setShowDetails(false);
      onConsentChange?.(preferences);
    }
  };

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: key === 'essential' ? true : value, // Essential is always true
    }));
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg ${className}`}>
      <Card className="max-w-6xl mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Cookie className="h-6 w-6 text-orange-500" />
              <div>
                <CardTitle className="text-lg">Cookie Preferences</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  We use cookies to enhance your experience and analyze our traffic.
                  {isAnonymousUser && (
                    <Badge variant="secondary" className="text-xs">
                      <UserX className="h-3 w-3 mr-1" />
                      Anonymous Session
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleAcceptAll} className="flex-1 min-w-[140px]">
              Accept All Cookies
            </Button>
            <Button 
              variant="outline" 
              onClick={handleAcceptEssential}
              className="flex-1 min-w-[140px]"
            >
              Essential Only
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Customize
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {/* Detailed Settings */}
          {showDetails && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Essential Cookies */}
                <div className="flex items-start justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-medium">Essential Cookies</h4>
                      <p className="text-sm text-muted-foreground">
                        Required for basic site functionality and security.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">Always On</Badge>
                    <Switch 
                      checked={true} 
                      disabled 
                      className="opacity-50"
                    />
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <BarChart3 className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-medium">Analytics Cookies</h4>
                      <p className="text-sm text-muted-foreground">
                        Help us understand how visitors interact with our website.
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={preferences.analytics}
                    onCheckedChange={(checked) => handlePreferenceChange('analytics', checked)}
                  />
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-medium">Marketing Cookies</h4>
                      <p className="text-sm text-muted-foreground">
                        Used to deliver personalized advertisements and content.
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={preferences.marketing}
                    onCheckedChange={(checked) => handlePreferenceChange('marketing', checked)}
                  />
                </div>

                {/* Functional Cookies */}
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-medium">Functional Cookies</h4>
                      <p className="text-sm text-muted-foreground">
                        Enable enhanced functionality and personalization.
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={preferences.functional}
                    onCheckedChange={(checked) => handlePreferenceChange('functional', checked)}
                  />
                </div>
              </div>

              {/* Custom Save Button */}
              <div className="flex justify-end pt-2">
                <Button onClick={handleCustomSave} className="min-w-[120px]">
                  Save Preferences
                </Button>
              </div>
            </div>
          )}

          {/* Anonymous User Notice */}
          {isAnonymousUser && (
            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <UserX className="h-3 w-3" />
                <span className="font-medium">Anonymous Session</span>
              </div>
              <p>
                Your preferences are saved for this session. When you register or log in, 
                your cookie preferences will be automatically linked to your account.
              </p>
              {anonymousId && (
                <p className="mt-1 font-mono text-xs opacity-70">
                  Session ID: {anonymousId.substring(0, 16)}...
                </p>
              )}
            </div>
          )}

          {/* Privacy Links */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
            <a href="/privacy-policy" className="hover:text-foreground underline">
              Privacy Policy
            </a>
            <a href="/cookie-policy" className="hover:text-foreground underline">
              Cookie Policy
            </a>
            <a href="/terms-of-service" className="hover:text-foreground underline">
              Terms of Service
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Cookie Preferences Manager Component (for settings page)
export function CookiePreferencesManager({ className }: { className?: string }) {
  const { 
    hasConsent, 
    preferences: currentPreferences, 
    saveConsent, 
    clearConsent,
    isAnonymousUser,
    consentData
  } = useCookieConsent();
  
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    functional: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Update local state when current preferences change
  useEffect(() => {
    if (currentPreferences) {
      setPreferences(currentPreferences);
    }
  }, [currentPreferences]);

  const handleSave = async () => {
    setIsLoading(true);
    const success = await saveConsent(preferences, 'settings_page');
    setIsLoading(false);
    
    if (success) {
      // Show success message or toast
      console.log('🍪 Preferences updated successfully');
    }
  };

  const handleClear = async () => {
    setIsLoading(true);
    const success = await clearConsent();
    setIsLoading(false);
    
    if (success) {
      setPreferences({
        essential: true,
        analytics: false,
        marketing: false,
        functional: false,
      });
    }
  };

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: key === 'essential' ? true : value,
    }));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cookie className="h-5 w-5" />
          Cookie Preferences
        </CardTitle>
        <CardDescription>
          Manage your cookie preferences and privacy settings.
          {isAnonymousUser && (
            <Badge variant="secondary" className="ml-2">
              <UserX className="h-3 w-3 mr-1" />
              Anonymous Session
            </Badge>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Status */}
        {hasConsent && consentData && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Current Status</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Consent Given:</span>
                <span className="ml-2">{new Date(consentData.timestamp).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Method:</span>
                <span className="ml-2 capitalize">{consentData.consentMethod.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Expires:</span>
                <span className="ml-2">{new Date(consentData.expiresAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <span className="ml-2">{consentData.isAnonymous ? 'Anonymous' : 'Registered'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Cookie Categories */}
        <div className="space-y-4">
          {/* Essential */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <h4 className="font-medium">Essential Cookies</h4>
                <p className="text-sm text-muted-foreground">
                  Required for basic site functionality
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">Always On</Badge>
              <Switch checked={true} disabled />
            </div>
          </div>

          {/* Analytics */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <div>
                <h4 className="font-medium">Analytics Cookies</h4>
                <p className="text-sm text-muted-foreground">
                  Help us understand website usage
                </p>
              </div>
            </div>
            <Switch 
              checked={preferences.analytics}
              onCheckedChange={(checked) => handlePreferenceChange('analytics', checked)}
            />
          </div>

          {/* Marketing */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-purple-500" />
              <div>
                <h4 className="font-medium">Marketing Cookies</h4>
                <p className="text-sm text-muted-foreground">
                  Personalized ads and content
                </p>
              </div>
            </div>
            <Switch 
              checked={preferences.marketing}
              onCheckedChange={(checked) => handlePreferenceChange('marketing', checked)}
            />
          </div>

          {/* Functional */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <h4 className="font-medium">Functional Cookies</h4>
                <p className="text-sm text-muted-foreground">
                  Enhanced functionality and features
                </p>
              </div>
            </div>
            <Switch 
              checked={preferences.functional}
              onCheckedChange={(checked) => handlePreferenceChange('functional', checked)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleClear}
            disabled={isLoading}
          >
            Clear All
          </Button>
        </div>

        {/* Anonymous User Notice */}
        {isAnonymousUser && (
          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border">
            <p>
              <strong>Anonymous Session:</strong> Your preferences will be automatically 
              linked to your account when you register or log in.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}