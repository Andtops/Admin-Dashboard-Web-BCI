"use client"

import React, { useState, useEffect } from 'react';
import { ReAuthModal } from './re-auth-modal';

interface ReAuthRequest {
  resolve: (success: boolean) => void;
  title?: string;
  description?: string;
}

export function ReAuthManager() {
  const [showModal, setShowModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<ReAuthRequest | null>(null);

  useEffect(() => {
    const handleReAuthRequest = (event: CustomEvent<ReAuthRequest>) => {
      setCurrentRequest(event.detail);
      setShowModal(true);
    };

    window.addEventListener('request-reauth', handleReAuthRequest as EventListener);
    return () => window.removeEventListener('request-reauth', handleReAuthRequest as EventListener);
  }, []);

  const handleSuccess = () => {
    
    // Dispatch success event for the context
    window.dispatchEvent(new CustomEvent('reauth-success'));

    // Resolve the current request
    if (currentRequest) {
            currentRequest.resolve(true);
    }

    // Clean up
    setShowModal(false);
    setCurrentRequest(null);
  };

  const handleCancel = () => {
    // Resolve the current request with failure
    if (currentRequest) {
      currentRequest.resolve(false);
    }
    
    // Clean up
    setShowModal(false);
    setCurrentRequest(null);
  };

  return (
    <ReAuthModal
      open={showModal}
      onOpenChange={setShowModal}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
      title={currentRequest?.title}
      description={currentRequest?.description}
    />
  );
}
