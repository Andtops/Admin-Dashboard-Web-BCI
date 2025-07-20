"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { generateAnonymousId, getAnonymousId, setAnonymousId, clearAnonymousId } from '@/lib/cookie-consent-linking';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

interface ConsentData {
  preferences: CookiePreferences;
  timestamp: string;
  consentMethod: string;
  expiresAt: number;
  isAnonymous: boolean;
}

interface CookieConsentContextType {
  // Consent state
  hasConsent: boolean;
  preferences: CookiePreferences | null;
  consentData: ConsentData | null;
  isLoading: boolean;
  
  // Anonymous user handling
  anonymousId: string | null;
  isAnonymousUser: boolean;
  
  // Actions
  saveConsent: (preferences: CookiePreferences, method?: string, userInfo?: UserInfo) => Promise<boolean>;
  clearConsent: () => Promise<boolean>;
  checkConsentStatus: () => Promise<void>;
  linkAnonymousConsent: (userInfo: UserInfo) => Promise<boolean>;
  
  // Utility
  refreshConsent: () => Promise<void>;
}

interface UserInfo {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

interface CookieConsentProviderProps {
  children: React.ReactNode;
  currentUser?: UserInfo | null; // Pass current user info if available
}

export function CookieConsentProvider({ children, currentUser }: CookieConsentProviderProps) {
  const [hasConsent, setHasConsent] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [consentData, setConsentData] = useState<ConsentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [anonymousId, setAnonymousIdState] = useState<string | null>(null);

  // Initialize anonymous ID if needed
  useEffect(() => {
    let currentAnonymousId = getAnonymousId();
    
    // If no anonymous ID exists and user is not logged in, create one
    if (!currentAnonymousId && !currentUser) {
      currentAnonymousId = generateAnonymousId();
      setAnonymousId(currentAnonymousId);
    }
    
    setAnonymousIdState(currentAnonymousId);
  }, [currentUser]);

  // Check consent status on mount and when user changes
  useEffect(() => {
    checkConsentStatus();
  }, [currentUser, anonymousId]);

  // Auto-link anonymous consent when user logs in
  useEffect(() => {
    if (currentUser && anonymousId && consentData?.isAnonymous) {
      linkAnonymousConsent(currentUser);
    }
  }, [currentUser, anonymousId, consentData]);

  const checkConsentStatus = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams();
      
      if (currentUser?.email) {
        params.append('email', currentUser.email);
      } else if (anonymousId) {
        params.append('anonymousId', anonymousId);
      } else {
        // No user and no anonymous ID, no consent to check
        setHasConsent(false);
        setPreferences(null);
        setConsentData(null);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/public/cookie-consent?${params.toString()}`);
      const data = await response.json();

      if (data.success && data.consent) {
        setHasConsent(true);
        setPreferences(data.consent.preferences);
        setConsentData(data.consent);
        
        console.log('🍪 Consent found:', data.consent);
      } else {
        setHasConsent(false);
        setPreferences(null);
        setConsentData(null);
      }
    } catch (error) {
      console.error('Error checking consent status:', error);
      setHasConsent(false);
      setPreferences(null);
      setConsentData(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, anonymousId]);

  const saveConsent = useCallback(async (
    newPreferences: CookiePreferences, 
    method: string = 'banner_custom',
    userInfo?: UserInfo
  ): Promise<boolean> => {
    try {
      const user = userInfo || currentUser;
      const currentAnonymousId = anonymousId;
      
      // For anonymous users, use temporary data
      const requestData = {
        firstName: user?.firstName || 'Anonymous',
        lastName: user?.lastName || 'User',
        email: user?.email || `${currentAnonymousId}@temp.local`,
        preferences: newPreferences,
        consentMethod: method,
        ipAddress: undefined, // Will be set by server
        userAgent: navigator.userAgent,
        anonymousId: user ? undefined : currentAnonymousId, // Only set if anonymous
      };

      const response = await fetch('/api/public/cookie-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        setHasConsent(true);
        setPreferences(data.preferences);
        setConsentData({
          preferences: data.preferences,
          timestamp: new Date(data.timestamp).toISOString(),
          consentMethod: method,
          expiresAt: data.expiresAt,
          isAnonymous: data.isAnonymous,
        });

        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('cookieConsentChanged', {
          detail: {
            preferences: data.preferences,
            isAnonymous: data.isAnonymous,
            method,
          }
        }));

        console.log('🍪 Consent saved successfully:', data);
        return true;
      } else {
        console.error('Failed to save consent:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Error saving consent:', error);
      return false;
    }
  }, [currentUser, anonymousId]);

  const clearConsent = useCallback(async (): Promise<boolean> => {
    try {
      const requestData = {
        email: currentUser?.email,
        anonymousId: currentUser ? undefined : anonymousId,
        reason: 'user_requested',
      };

      const response = await fetch('/api/public/cookie-consent', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        setHasConsent(false);
        setPreferences(null);
        setConsentData(null);

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('cookieConsentCleared', {
          detail: { timestamp: new Date().toISOString() }
        }));

        console.log('🍪 Consent cleared successfully');
        return true;
      } else {
        console.error('Failed to clear consent:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error clearing consent:', error);
      return false;
    }
  }, [currentUser, anonymousId]);

  const linkAnonymousConsent = useCallback(async (userInfo: UserInfo): Promise<boolean> => {
    if (!anonymousId) {
      console.log('🍪 No anonymous ID to link');
      return false;
    }

    try {
      const response = await fetch('/api/public/cookie-consent', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          anonymousId,
          userId: userInfo.userId,
          userEmail: userInfo.email,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Clear anonymous ID since it's now linked
        clearAnonymousId();
        setAnonymousIdState(null);

        // Refresh consent status to get updated data
        await checkConsentStatus();

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('cookieConsentLinked', {
          detail: {
            action: data.action,
            userEmail: userInfo.email,
            previousAnonymousId: anonymousId,
          }
        }));

        console.log('🍪 Anonymous consent linked successfully:', data);
        return true;
      } else {
        console.error('Failed to link anonymous consent:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error linking anonymous consent:', error);
      return false;
    }
  }, [anonymousId, checkConsentStatus]);

  const refreshConsent = useCallback(async () => {
    await checkConsentStatus();
  }, [checkConsentStatus]);

  const value: CookieConsentContextType = {
    // State
    hasConsent,
    preferences,
    consentData,
    isLoading,
    anonymousId,
    isAnonymousUser: !currentUser && !!anonymousId,
    
    // Actions
    saveConsent,
    clearConsent,
    checkConsentStatus,
    linkAnonymousConsent,
    refreshConsent,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
}

// Export types
export type { CookiePreferences, ConsentData, UserInfo };