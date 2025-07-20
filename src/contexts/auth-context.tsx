"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface Admin {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  permissions?: string[];
}

interface AuthContextType {
  admin: Admin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  csrfToken: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  // Get CSRF token from cookie
  const getCSRFToken = (): string | null => {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('benzochem-csrf-token='));
    return csrfCookie ? csrfCookie.split('=')[1] : null;
  };

  // Check session on mount and periodically
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.admin) {
            setAdmin(data.admin);
            setCsrfToken(getCSRFToken());
          } else {
            setAdmin(null);
            setCsrfToken(null);
          }
        } else {
          setAdmin(null);
          setCsrfToken(null);
        }
      } catch (error) {
        console.error('Session check error:', error);
        setAdmin(null);
        setCsrfToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Set up periodic session refresh (every 30 minutes)
    const interval = setInterval(checkSession, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, csrfToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAdmin(data.admin);
        setCsrfToken(data.csrfToken);
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      return { success: false, error: "Login failed. Please try again." };
    }
  };

  const logout = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        },
        credentials: 'include',
        body: JSON.stringify({ csrfToken }),
      });

      // Clear local state regardless of API response
      setAdmin(null);
      setCsrfToken(null);

      // Force redirect to login page after logout
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }

      if (response.ok) {
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || "Logout failed" };
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Clear local state even on error
      setAdmin(null);
      setCsrfToken(null);

      // Force redirect to login page even on error
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }

      return { success: false, error: "Logout failed" };
    }
  };

  const refreshSession = async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.admin) {
          setAdmin(data.admin);
          setCsrfToken(getCSRFToken());
        } else {
          setAdmin(null);
          setCsrfToken(null);
        }
      } else {
        setAdmin(null);
        setCsrfToken(null);
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      setAdmin(null);
      setCsrfToken(null);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!admin) return false;
    if (admin.role === "super_admin") return true; // Super admins have all permissions
    return admin.permissions?.includes(permission) || false;
  };

  const isAuthenticated = !!admin;

  const value: AuthContextType = {
    admin,
    isLoading,
    isAuthenticated,
    csrfToken,
    login,
    logout,
    refreshSession,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
