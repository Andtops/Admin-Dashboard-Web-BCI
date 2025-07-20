"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Eye, EyeOff, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useReAuth } from '@/contexts/re-auth-context';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface SecureApiKeyDisplayProps {
  apiKey: string;
  keyId: string;
  apiKeyDocId?: string; // Convex document ID for fetching full key
  className?: string;
  showCopyButton?: boolean;
  showToggleButton?: boolean;
  placeholder?: string;
  allowImmediateAccess?: boolean; // For newly created keys
}

export function SecureApiKeyDisplay({
  apiKey,
  keyId,
  apiKeyDocId,
  className = "",
  showCopyButton = true,
  showToggleButton = true,
  placeholder = "••••••••••••••••••••••••••••••••",
  allowImmediateAccess = false
}: SecureApiKeyDisplayProps) {
  const [isVisible, setIsVisible] = useState(allowImmediateAccess);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [inputWidth, setInputWidth] = useState<string>('200px');
  const { requestReAuth, isReAuthValid } = useReAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch full API key when needed (only when visible and we have a doc ID)
  const fullApiKeyData = useQuery(
    api.apiKeys?.getFullApiKeyById,
    isVisible && apiKeyDocId ? { id: apiKeyDocId as any } : "skip"
  );



  const handleRevealKey = async () => {
    if (isVisible) {
      setIsVisible(false);
      return;
    }

    // If immediate access is allowed, show the key without re-auth
    if (allowImmediateAccess) {
      console.log('Immediate access allowed, showing key');
      setIsVisible(true);
      return;
    }

    // Check if we need re-authentication
    if (!isReAuthValid()) {
      setIsAuthenticating(true);
      try {
                const success = await requestReAuth();
        if (success) {
                    setIsVisible(true);
          toast.success('API key revealed');
        } else {
          toast.error('Authentication required to view API key');
        }
      } catch (error) {
                toast.error('Authentication failed');
      } finally {
        setIsAuthenticating(false);
      }
    } else {
      console.log('Re-auth still valid, setting visible to true');
      setIsVisible(true);
    }
  };

  const handleCopyKey = async () => {
    // If immediate access is allowed, copy without re-auth
    if (allowImmediateAccess) {
      console.log('Immediate access allowed, copying key');
      await copyToClipboard();
      return;
    }

    // Check if we need re-authentication
    if (!isReAuthValid()) {
      setIsAuthenticating(true);
      try {
        console.log('Requesting re-auth for key copy');
        const success = await requestReAuth();
        if (success) {
          console.log('Re-auth successful for copy, copying key');
          await copyToClipboard();
        } else {
          toast.error('Authentication required to copy API key');
        }
      } catch (error) {
        toast.error('Authentication failed');
      } finally {
        setIsAuthenticating(false);
      }
    } else {
      await copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    try {
      // Use the full API key if available, otherwise use the provided key
      const keyToCopy = fullApiKeyData?.key || apiKey;
      await navigator.clipboard.writeText(keyToCopy);
      toast.success('API key copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy API key');
    }
  };

  // Use full API key if available and visible, otherwise use the provided (possibly masked) key
  const actualApiKey = isVisible && fullApiKeyData?.key ? fullApiKeyData.key : apiKey;
  const displayValue = isVisible ? actualApiKey : placeholder;

  // Calculate optimal width based on the actual API key (not display value)
  // This ensures consistent sizing regardless of visibility state
  const calculateOptimalWidth = (apiKeyText: string): string => {
    if (!apiKeyText) return '400px'; // Default width for placeholder

    // More accurate character width for monospace font at text-xs
    const charWidth = 7.4;
    const padding = 16; // Minimal padding (8px left + 8px right)
    const buttonSpace = 28; // Fixed space for consistency (accounts for shield icon)

    // Calculate width based on the actual API key length (not display value)
    const contentWidth = apiKeyText.length * charWidth;
    const totalWidth = contentWidth + padding + buttonSpace;

    // Set reasonable min and max widths with responsive behavior
    const minWidth = 400; // Increased minimum for better appearance
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const maxWidth = Math.min(800, viewportWidth * 0.5);

    const finalWidth = Math.max(minWidth, Math.min(maxWidth, totalWidth));
    return `${finalWidth}px`;
  };

  // Update input width based on actual API key (not display value)
  // This ensures consistent sizing regardless of visibility state
  useEffect(() => {
    const keyToMeasure = fullApiKeyData?.key || apiKey;
    const newWidth = calculateOptimalWidth(keyToMeasure);
    setInputWidth(newWidth);
  }, [apiKey, fullApiKeyData?.key]);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const keyToMeasure = fullApiKeyData?.key || apiKey;
      const newWidth = calculateOptimalWidth(keyToMeasure);
      setInputWidth(newWidth);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [apiKey, fullApiKeyData?.key]);



  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative" style={{ width: inputWidth, minWidth: '200px', maxWidth: '100%' }}>
        <Input
          ref={inputRef}
          value={displayValue}
          readOnly
          className="font-mono text-xs cursor-text w-full px-3 py-2 pr-8"
          placeholder={placeholder}
          style={{
            whiteSpace: 'nowrap',
            textOverflow: 'clip'
          }}
          title={isVisible ? displayValue : "Click the eye icon to reveal the API key"}
        />
        {!isVisible && (
          <div className="absolute inset-y-0 right-2 flex items-center">
            <Shield className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex gap-1 flex-shrink-0">
        {showToggleButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRevealKey}
            disabled={isAuthenticating}
            title={isVisible ? "Hide API key" : "Show API key (requires authentication)"}
          >
            {isVisible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        )}

        {showCopyButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyKey}
            disabled={isAuthenticating}
            title="Copy API key (requires authentication)"
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface SecureApiKeyFieldProps {
  label: string;
  apiKey: string;
  keyId: string;
  apiKeyDocId?: string;
  description?: string;
  className?: string;
}

export function SecureApiKeyField({
  label,
  apiKey,
  keyId,
  apiKeyDocId,
  description,
  className = ""
}: SecureApiKeyFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Protected</span>
        </div>
      </div>
      
      <SecureApiKeyDisplay
        apiKey={apiKey}
        keyId={keyId}
        apiKeyDocId={apiKeyDocId}
      />
      
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
