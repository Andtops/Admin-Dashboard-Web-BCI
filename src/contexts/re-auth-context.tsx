"use client"

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ReAuthContextType {
  isReAuthenticated: boolean;
  reAuthTimestamp: number | null;
  requestReAuth: () => Promise<boolean>;
  clearReAuth: () => void;
  isReAuthValid: () => boolean;
}

const ReAuthContext = createContext<ReAuthContextType | undefined>(undefined);

const RE_AUTH_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export function ReAuthProvider({ children }: { children: React.ReactNode }) {
  const [isReAuthenticated, setIsReAuthenticated] = useState(false);
  const [reAuthTimestamp, setReAuthTimestamp] = useState<number | null>(null);

  const isReAuthValid = useCallback(() => {
    if (!isReAuthenticated || !reAuthTimestamp) return false;
    return Date.now() - reAuthTimestamp < RE_AUTH_TIMEOUT;
  }, [isReAuthenticated, reAuthTimestamp]);

  const requestReAuth = useCallback(async (): Promise<boolean> => {
    // Check if current re-auth is still valid
    if (isReAuthValid()) {
      return true;
    }

    // This will be implemented to show the re-auth modal
    // For now, we'll return a promise that resolves when re-auth is complete
    return new Promise((resolve) => {
      // This will be replaced with actual modal logic
      const event = new CustomEvent('request-reauth', {
        detail: { resolve }
      });
      window.dispatchEvent(event);
    });
  }, [isReAuthValid]);

  const clearReAuth = useCallback(() => {
    setIsReAuthenticated(false);
    setReAuthTimestamp(null);
  }, []);

  // Internal method to set re-auth success (called by the modal)
  const setReAuthSuccess = useCallback(() => {
        setIsReAuthenticated(true);
    setReAuthTimestamp(Date.now());
  }, []);

  // Listen for re-auth success events
  React.useEffect(() => {
    const handleReAuthSuccess = () => {
      setReAuthSuccess();
    };

    window.addEventListener('reauth-success', handleReAuthSuccess);
    return () => window.removeEventListener('reauth-success', handleReAuthSuccess);
  }, [setReAuthSuccess]);

  const value: ReAuthContextType = {
    isReAuthenticated,
    reAuthTimestamp,
    requestReAuth,
    clearReAuth,
    isReAuthValid,
  };

  return (
    <ReAuthContext.Provider value={value}>
      {children}
    </ReAuthContext.Provider>
  );
}

export function useReAuth() {
  const context = useContext(ReAuthContext);
  if (context === undefined) {
    throw new Error('useReAuth must be used within a ReAuthProvider');
  }
  return context;
}
