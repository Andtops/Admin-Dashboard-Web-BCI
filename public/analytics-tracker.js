/**
 * Benzochem Analytics Tracker
 * Real-time visitor tracking for analytics dashboard
 * 
 * Usage:
 * <script src="https://your-admin-domain.com/analytics-tracker.js"></script>
 * <script>
 *   BenzochemAnalytics.init({
 *     apiUrl: 'https://your-admin-domain.com/api/v1/analytics/track-visitor',
 *     trackingEnabled: true
 *   });
 * </script>
 */

(function(window, document) {
  'use strict';

  // Configuration
  const DEFAULT_CONFIG = {
    apiUrl: null,
    trackingEnabled: true,
    trackingInterval: 120000, // 2 minutes
    heartbeatInterval: 30000,  // 30 seconds
    debug: false,
  };

  // Global state
  let config = { ...DEFAULT_CONFIG };
  let sessionId = null;
  let lastTrackTime = 0;
  let trackingInterval = null;
  let heartbeatInterval = null;
  let isTracking = false;

  // Utility functions
  function log(...args) {
    if (config.debug) {
      console.log('[BenzochemAnalytics]', ...args);
    }
  }

  function generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `session_${timestamp}_${random}`;
  }

  function getSessionId() {
    if (sessionId) return sessionId;
    
    try {
      // Try to get from secure cookie
      sessionId = getCookieValue('benzochem_visitor_session');
      if (!sessionId) {
        sessionId = generateSessionId();
        setCookieValue('benzochem_visitor_session', sessionId);
      }
    } catch (e) {
      // Fallback if cookies are not available
      sessionId = generateSessionId();
    }
    
    return sessionId;
  }

  function getCookieValue(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    
    return null;
  }

  function setCookieValue(name, value) {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString(); // 24 hours
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Strict; Secure=${location.protocol === 'https:'}`;
  }

  function getCurrentPage() {
    return window.location.pathname + window.location.search;
  }

  function getReferrer() {
    return document.referrer || undefined;
  }

  // Get visitor location using IP geolocation
  async function getVisitorLocation() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        return {
          country: data.country_name || 'Unknown',
          city: data.city || 'Unknown',
          latitude: data.latitude || null,
          longitude: data.longitude || null,
        };
      }
    } catch (error) {
      log('Failed to get visitor location:', error);
    }
    
    return {
      country: 'Unknown',
      city: 'Unknown',
      latitude: null,
      longitude: null,
    };
  }

  // Track visitor activity
  async function trackVisitor() {
    if (!config.apiUrl || !config.trackingEnabled) {
      log('Tracking disabled or no API URL configured');
      return;
    }

    const now = Date.now();
    // Throttle tracking requests
    if (now - lastTrackTime < 30000) {
      log('Throttling tracking request');
      return;
    }

    try {
      const location = await getVisitorLocation();
      const trackingData = {
        sessionId: getSessionId(),
        page: getCurrentPage(),
        referrer: getReferrer(),
        country: location.country,
        city: location.city,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: now,
      };

      log('Tracking visitor:', trackingData);

      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trackingData),
      });

      if (response.ok) {
        const result = await response.json();
        log('Tracking successful:', result);
        lastTrackTime = now;
      } else {
        log('Tracking failed:', response.status, response.statusText);
      }
    } catch (error) {
      log('Tracking error:', error);
    }
  }

  // Handle page visibility changes
  function handleVisibilityChange() {
    if (!document.hidden && config.trackingEnabled) {
      log('Page became visible, tracking visitor');
      trackVisitor();
    }
  }

  // Handle page focus
  function handleFocus() {
    if (config.trackingEnabled) {
      log('Page focused, tracking visitor');
      trackVisitor();
    }
  }

  // Handle page unload
  function handleUnload() {
    if (trackingInterval) {
      clearInterval(trackingInterval);
    }
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
  }

  // Start tracking
  function startTracking() {
    if (isTracking) {
      log('Tracking already started');
      return;
    }

    log('Starting visitor tracking');
    isTracking = true;

    // Initial tracking
    trackVisitor();

    // Set up periodic tracking
    trackingInterval = setInterval(() => {
      if (!document.hidden && config.trackingEnabled) {
        trackVisitor();
      }
    }, config.trackingInterval);

    // Set up heartbeat (more frequent updates when active)
    heartbeatInterval = setInterval(() => {
      if (!document.hidden && config.trackingEnabled) {
        const now = Date.now();
        if (now - lastTrackTime > config.heartbeatInterval) {
          trackVisitor();
        }
      }
    }, config.heartbeatInterval);

    // Event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('unload', handleUnload);
  }

  // Stop tracking
  function stopTracking() {
    if (!isTracking) {
      log('Tracking not started');
      return;
    }

    log('Stopping visitor tracking');
    isTracking = false;

    if (trackingInterval) {
      clearInterval(trackingInterval);
      trackingInterval = null;
    }

    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }

    // Remove event listeners
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('beforeunload', handleUnload);
    window.removeEventListener('unload', handleUnload);
  }

  // Public API
  const BenzochemAnalytics = {
    // Initialize tracking
    init: function(userConfig = {}) {
      config = { ...DEFAULT_CONFIG, ...userConfig };
      log('Initializing with config:', config);
      
      if (!config.apiUrl) {
        console.warn('[BenzochemAnalytics] No API URL provided. Tracking disabled.');
        config.trackingEnabled = false;
        return;
      }

      // Start tracking when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startTracking);
      } else {
        startTracking();
      }
    },

    // Manual tracking
    track: function() {
      trackVisitor();
    },

    // Enable/disable tracking
    enable: function() {
      config.trackingEnabled = true;
      if (!isTracking) {
        startTracking();
      }
      log('Tracking enabled');
    },

    disable: function() {
      config.trackingEnabled = false;
      stopTracking();
      log('Tracking disabled');
    },

    // Get current session ID
    getSessionId: function() {
      return getSessionId();
    },

    // Get configuration
    getConfig: function() {
      return { ...config };
    },

    // Update configuration
    updateConfig: function(newConfig) {
      const wasTracking = isTracking;
      if (wasTracking) {
        stopTracking();
      }
      
      config = { ...config, ...newConfig };
      log('Configuration updated:', config);
      
      if (wasTracking && config.trackingEnabled) {
        startTracking();
      }
    },

    // Version
    version: '1.0.0',
  };

  // Expose to global scope
  window.BenzochemAnalytics = BenzochemAnalytics;

  // Auto-initialize if config is provided via data attributes
  const script = document.currentScript;
  if (script) {
    const apiUrl = script.getAttribute('data-api-url');
    const debug = script.getAttribute('data-debug') === 'true';
    
    if (apiUrl) {
      BenzochemAnalytics.init({
        apiUrl: apiUrl,
        debug: debug,
      });
    }
  }

})(window, document);