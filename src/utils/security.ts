
import DOMPurify from 'dompurify';
import { z } from 'zod';

// Input sanitization utility
export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true 
  });
};

// HTML sanitization for rich content
export const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
    FORBID_SCRIPT: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button']
  });
};

// Generate secure random token
export const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Validate email with strict pattern
export const validateEmail = (email: string): boolean => {
  const emailSchema = z.string().email().min(5).max(100);
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
};

// Password strength validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 12) errors.push('Password must be at least 12 characters long');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
  if (!/\d/.test(password)) errors.push('Password must contain at least one number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Password must contain at least one special character');
  if (/(.)\1{2,}/.test(password)) errors.push('Password cannot contain repeated characters');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Rate limiting utility
class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);
    
    if (!record || now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (record.count >= maxAttempts) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// Secure session token validation
export const validateSessionToken = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  if (token.length < 32) return false;
  if (!/^[a-zA-Z0-9+/=]+$/.test(token)) return false;
  return true;
};

// Content Security Policy headers
export const getSecurityHeaders = () => ({
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
});

// Audit logging
export const auditLog = (action: string, userId?: string, details?: Record<string, any>) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: sanitizeInput(action),
    userId: userId ? sanitizeInput(userId) : 'anonymous',
    userAgent: navigator.userAgent,
    details: details ? Object.fromEntries(
      Object.entries(details).map(([k, v]) => [k, typeof v === 'string' ? sanitizeInput(v) : v])
    ) : {},
    sessionId: sessionStorage.getItem('session_id') || 'unknown'
  };
  
  // In production, send to secure logging service
  console.log('[AUDIT]', logEntry);
};
