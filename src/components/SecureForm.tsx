
import React, { useState, FormEvent, ReactNode } from 'react';
import { sanitizeInput, generateSecureToken, auditLog } from '@/utils/security';
import { useSecurity } from './SecurityProvider';

interface SecureFormProps {
  onSubmit: (data: Record<string, string>, csrfToken: string) => Promise<void>;
  children: ReactNode;
  className?: string;
  requireCSRF?: boolean;
}

export const SecureForm = ({ 
  onSubmit, 
  children, 
  className = '', 
  requireCSRF = true 
}: SecureFormProps) => {
  const [csrfToken] = useState(() => generateSecureToken());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { reportSecurityEvent } = useSecurity();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isSubmitting) {
      reportSecurityEvent('DOUBLE_SUBMIT_ATTEMPT');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const sanitizedData: Record<string, string> = {};
      
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          sanitizedData[sanitizeInput(key)] = sanitizeInput(value);
        }
      }
      
      // Validate CSRF token if required
      if (requireCSRF) {
        const submittedToken = sanitizedData.csrfToken;
        if (!submittedToken || submittedToken !== csrfToken) {
          reportSecurityEvent('CSRF_TOKEN_MISMATCH', { 
            expected: csrfToken.substring(0, 8) + '...',
            received: submittedToken?.substring(0, 8) + '...' || 'none'
          });
          throw new Error('Security validation failed. Please refresh the page and try again.');
        }
        delete sanitizedData.csrfToken;
      }
      
      auditLog('SECURE_FORM_SUBMIT', undefined, { 
        fields: Object.keys(sanitizedData),
        csrfValidated: requireCSRF 
      });
      
      await onSubmit(sanitizedData, csrfToken);
    } catch (error: any) {
      auditLog('SECURE_FORM_ERROR', undefined, { error: error.message });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {requireCSRF && (
        <input type="hidden" name="csrfToken" value={csrfToken} />
      )}
      {children}
    </form>
  );
};
