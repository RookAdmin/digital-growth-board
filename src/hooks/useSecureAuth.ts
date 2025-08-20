
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { validateSessionToken, rateLimiter, auditLog, sanitizeInput } from '@/utils/security';

export function useSecureAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const checkAuthState = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        auditLog('AUTH_ERROR', undefined, { error: error.message });
        throw error;
      }
      
      if (session?.access_token && !validateSessionToken(session.access_token)) {
        auditLog('INVALID_SESSION_TOKEN', session.user?.id);
        await supabase.auth.signOut();
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        auditLog('SESSION_VALIDATED', session.user.id);
      }
    } catch (error) {
      console.error('Auth state check failed:', error);
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Generate session ID for audit logging
    if (!sessionStorage.getItem('session_id')) {
      sessionStorage.setItem('session_id', crypto.randomUUID());
    }

    checkAuthState();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        auditLog('AUTH_STATE_CHANGE', session?.user?.id, { event });
        
        if (session?.access_token && !validateSessionToken(session.access_token)) {
          auditLog('INVALID_SESSION_TOKEN_ON_CHANGE', session.user?.id);
          await supabase.auth.signOut();
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setLoginAttempts(0);
          setIsLocked(false);
          rateLimiter.reset(session.user.email || '');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [checkAuthState]);

  const secureSignIn = async (email: string, password: string) => {
    const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());
    
    // Rate limiting check
    if (!rateLimiter.isAllowed(sanitizedEmail, 5, 15 * 60 * 1000)) {
      setIsLocked(true);
      auditLog('LOGIN_RATE_LIMITED', undefined, { email: sanitizedEmail });
      throw new Error('Too many login attempts. Please try again in 15 minutes.');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: password
      });

      if (error) {
        setLoginAttempts(prev => prev + 1);
        auditLog('LOGIN_FAILED', undefined, { 
          email: sanitizedEmail, 
          error: error.message,
          attempts: loginAttempts + 1 
        });
        throw error;
      }

      auditLog('LOGIN_SUCCESS', data.user?.id, { email: sanitizedEmail });
      return { data, error: null };
    } catch (error: any) {
      auditLog('LOGIN_ERROR', undefined, { 
        email: sanitizedEmail, 
        error: error.message 
      });
      throw error;
    }
  };

  const secureSignOut = async () => {
    try {
      auditLog('LOGOUT_INITIATED', user?.id);
      
      // Clear all auth-related storage
      ['supabase.auth.token', 'session_id'].forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      // Clear any Supabase auth keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        auditLog('LOGOUT_ERROR', user?.id, { error: error.message });
        throw error;
      }
      
      auditLog('LOGOUT_SUCCESS', user?.id);
      setSession(null);
      setUser(null);
      setLoginAttempts(0);
      setIsLocked(false);
      
      // Force page reload for complete cleanup
      window.location.href = '/';
    } catch (error: any) {
      auditLog('LOGOUT_ERROR', user?.id, { error: error.message });
      throw error;
    }
  };

  return {
    session,
    user,
    loading,
    loginAttempts,
    isLocked,
    signIn: secureSignIn,
    signOut: secureSignOut
  };
}
