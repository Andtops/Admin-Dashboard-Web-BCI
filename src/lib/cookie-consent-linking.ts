/**
 * Cookie Consent Linking Utilities
 * 
 * This module handles linking anonymous cookie consent to user accounts
 * when users register or log in.
 */

interface LinkConsentParams {
  userId: string;
  userEmail: string;
  firstName: string;
  lastName: string;
  anonymousId?: string;
}

interface LinkConsentResult {
  success: boolean;
  action?: "converted_to_user" | "linked_to_existing";
  message?: string;
  error?: string;
}

/**
 * Links anonymous cookie consent to a user account
 * Call this function when a user registers or logs in
 */
export async function linkAnonymousConsentToUser(params: LinkConsentParams): Promise<LinkConsentResult> {
  try {
    // Get anonymous ID from cookie if not provided
    let anonymousId = params.anonymousId;
    
    if (!anonymousId) {
      // Try to get from cookie
      const cookies = document.cookie.split(';');
      const anonymousCookie = cookies.find(cookie => 
        cookie.trim().startsWith('anonymous_consent_id=')
      );
      
      if (anonymousCookie) {
        anonymousId = anonymousCookie.split('=')[1];
      }
    }

    // If no anonymous ID found, no linking needed
    if (!anonymousId) {
      return {
        success: true,
        message: "No anonymous consent found to link"
      };
    }

    // Call the API to link consent
    const response = await fetch('/api/cookie-consent/link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        anonymousId,
        userId: params.userId,
        userEmail: params.userEmail,
        firstName: params.firstName,
        lastName: params.lastName,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('cookieConsentLinked', {
        detail: {
          action: result.action,
          userEmail: params.userEmail,
          anonymousId,
        }
      }));

      console.log(`🍪 Cookie consent linked successfully:`, result);
      return result;
    } else {
      console.warn(`🍪 Failed to link cookie consent:`, result.error);
      return {
        success: false,
        error: result.error || "Failed to link consent"
      };
    }
  } catch (error) {
    console.error("Error linking anonymous consent:", error);
    return {
      success: false,
      error: "Network error while linking consent"
    };
  }
}

/**
 * Generates a unique anonymous ID for tracking consent before user registration
 */
export function generateAnonymousId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Gets the current anonymous ID from cookie
 */
export function getAnonymousId(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const anonymousCookie = cookies.find(cookie => 
    cookie.trim().startsWith('anonymous_consent_id=')
  );
  
  return anonymousCookie ? anonymousCookie.split('=')[1] : null;
}

/**
 * Sets anonymous ID in cookie
 */
export function setAnonymousId(anonymousId: string): void {
  if (typeof document === 'undefined') return;
  
  // Set cookie for 1 year
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  
  document.cookie = `anonymous_consent_id=${anonymousId}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Clears anonymous ID cookie (called after successful linking)
 */
export function clearAnonymousId(): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = 'anonymous_consent_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

/**
 * Hook for React components to use consent linking
 */
export function useCookieConsentLinking() {
  const linkConsent = async (params: Omit<LinkConsentParams, 'anonymousId'>) => {
    return await linkAnonymousConsentToUser(params);
  };

  const getAnonymousConsentId = () => {
    return getAnonymousId();
  };

  const generateNewAnonymousId = () => {
    const id = generateAnonymousId();
    setAnonymousId(id);
    return id;
  };

  return {
    linkConsent,
    getAnonymousConsentId,
    generateNewAnonymousId,
    clearAnonymousId,
  };
}

// Export types for use in other files
export type { LinkConsentParams, LinkConsentResult };