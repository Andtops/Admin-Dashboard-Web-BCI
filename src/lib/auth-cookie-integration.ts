/**
 * Authentication & Cookie Consent Integration
 * 
 * This module provides utilities to integrate cookie consent with user authentication.
 * Call these functions during user registration/login to automatically link anonymous consent.
 */

import { linkAnonymousConsentToUser, getAnonymousId, clearAnonymousId } from './cookie-consent-linking';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthCookieIntegrationResult {
  success: boolean;
  consentLinked: boolean;
  action?: "converted_to_user" | "linked_to_existing" | "no_consent_found";
  message?: string;
  error?: string;
}

/**
 * Call this function immediately after successful user registration
 * to link any existing anonymous cookie consent to the new user account
 */
export async function handleUserRegistration(userData: UserData): Promise<AuthCookieIntegrationResult> {
  try {
    console.log(`🔐 Handling user registration for: ${userData.email}`);
    
    // Check if there's anonymous consent to link
    const anonymousId = getAnonymousId();
    
    if (!anonymousId) {
      return {
        success: true,
        consentLinked: false,
        action: "no_consent_found",
        message: "No anonymous consent found to link"
      };
    }

    // Link anonymous consent to the new user account
    const linkResult = await linkAnonymousConsentToUser({
      userId: userData.id,
      userEmail: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      anonymousId,
    });

    if (linkResult.success) {
      // Clear anonymous ID since it's now linked
      clearAnonymousId();
      
      console.log(`🍪 Successfully linked anonymous consent to new user: ${userData.email}`);
      
      return {
        success: true,
        consentLinked: true,
        action: linkResult.action as "converted_to_user" | "linked_to_existing",
        message: `Anonymous consent successfully linked to your account`
      };
    } else {
      console.warn(`🍪 Failed to link anonymous consent: ${linkResult.error}`);
      
      return {
        success: true, // Registration still successful
        consentLinked: false,
        error: linkResult.error,
        message: "Registration successful, but failed to link cookie preferences"
      };
    }
  } catch (error) {
    console.error("Error during user registration cookie integration:", error);
    
    return {
      success: true, // Don't fail registration due to cookie linking issues
      consentLinked: false,
      error: "Network error while linking cookie preferences",
      message: "Registration successful, but cookie preferences may need to be set again"
    };
  }
}

/**
 * Call this function immediately after successful user login
 * to link any existing anonymous cookie consent to the user account
 */
export async function handleUserLogin(userData: UserData): Promise<AuthCookieIntegrationResult> {
  try {
    console.log(`🔐 Handling user login for: ${userData.email}`);
    
    // Check if there's anonymous consent to link
    const anonymousId = getAnonymousId();
    
    if (!anonymousId) {
      return {
        success: true,
        consentLinked: false,
        action: "no_consent_found",
        message: "No anonymous consent found to link"
      };
    }

    // Link anonymous consent to the user account
    const linkResult = await linkAnonymousConsentToUser({
      userId: userData.id,
      userEmail: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      anonymousId,
    });

    if (linkResult.success) {
      // Clear anonymous ID since it's now linked
      clearAnonymousId();
      
      console.log(`🍪 Successfully linked anonymous consent to logged-in user: ${userData.email}`);
      
      return {
        success: true,
        consentLinked: true,
        action: linkResult.action as "converted_to_user" | "linked_to_existing",
        message: "Your cookie preferences have been linked to your account"
      };
    } else {
      console.warn(`🍪 Failed to link anonymous consent: ${linkResult.error}`);
      
      return {
        success: true, // Login still successful
        consentLinked: false,
        error: linkResult.error,
        message: "Login successful, but failed to link cookie preferences"
      };
    }
  } catch (error) {
    console.error("Error during user login cookie integration:", error);
    
    return {
      success: true, // Don't fail login due to cookie linking issues
      consentLinked: false,
      error: "Network error while linking cookie preferences",
      message: "Login successful, but cookie preferences may need to be set again"
    };
  }
}

/**
 * Call this function when a user logs out to clear any session-specific data
 */
export async function handleUserLogout(): Promise<void> {
  try {
    console.log(`🔐 Handling user logout - clearing session data`);
    
    // Clear any anonymous ID (shouldn't exist for logged-in users, but just in case)
    clearAnonymousId();
    
    // Dispatch custom event to notify components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('userLoggedOut', {
        detail: { timestamp: new Date().toISOString() }
      }));
    }
    
    console.log(`🍪 Session data cleared on logout`);
  } catch (error) {
    console.error("Error during user logout cookie integration:", error);
  }
}

/**
 * React hook for easy integration with authentication flows
 */
export function useAuthCookieIntegration() {
  const handleRegistration = async (userData: UserData) => {
    return await handleUserRegistration(userData);
  };

  const handleLogin = async (userData: UserData) => {
    return await handleUserLogin(userData);
  };

  const handleLogout = async () => {
    await handleUserLogout();
  };

  return {
    handleRegistration,
    handleLogin,
    handleLogout,
  };
}

// Example usage in your authentication components:
/*

// In your registration component:
import { handleUserRegistration } from '@/lib/auth-cookie-integration';

const handleRegister = async (formData) => {
  try {
    // Your existing registration logic
    const user = await registerUser(formData);
    
    // Link anonymous cookie consent
    const cookieResult = await handleUserRegistration({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    
    if (cookieResult.consentLinked) {
      showToast("Account created and cookie preferences linked!");
    }
    
    // Continue with your post-registration flow
  } catch (error) {
    // Handle registration error
  }
};

// In your login component:
import { handleUserLogin } from '@/lib/auth-cookie-integration';

const handleLogin = async (credentials) => {
  try {
    // Your existing login logic
    const user = await loginUser(credentials);
    
    // Link anonymous cookie consent
    const cookieResult = await handleUserLogin({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    
    if (cookieResult.consentLinked) {
      showToast("Logged in and cookie preferences linked!");
    }
    
    // Continue with your post-login flow
  } catch (error) {
    // Handle login error
  }
};

// In your logout component:
import { handleUserLogout } from '@/lib/auth-cookie-integration';

const handleLogout = async () => {
  try {
    // Your existing logout logic
    await logoutUser();
    
    // Clear session data
    await handleUserLogout();
    
    // Continue with your post-logout flow
  } catch (error) {
    // Handle logout error
  }
};

*/

export type { UserData, AuthCookieIntegrationResult };