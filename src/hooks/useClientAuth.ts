
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthError } from '@supabase/supabase-js';

interface ClientUser {
  id: string;
  client_id: string;
  email: string;
  is_active: boolean;
  last_login: string | null;
  password_changed: boolean | null;
}

export const useClientAuth = () => {
  const [clientUser, setClientUser] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        if (session?.user) {
          // Use setTimeout to avoid blocking the auth callback
          setTimeout(async () => {
            if (!mounted) return;
            try {
              const { data: clientUserData } = await supabase
                .from('client_users')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
              
              if (mounted && clientUserData) {
                setClientUser(clientUserData);
              }
            } catch (error) {
              console.error('Error fetching client user:', error);
            } finally {
              if (mounted) setLoading(false);
            }
          }, 0);
        } else {
          setClientUser(null);
          setLoading(false);
        }
      }
    );

    // Then check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session?.user) {
          const { data: clientUserData } = await supabase
            .from('client_users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (clientUserData) {
            setClientUser(clientUserData);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { data, error };
    }

    if (data.user) {
      const { data: clientUserData, error: clientUserError } = await supabase
        .from('client_users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (clientUserError || !clientUserData) {
        await supabase.auth.signOut();
        const customError = new AuthError(
          'Access denied. You are not a registered client user.',
          401
        );
        setClientUser(null);
        return { data: null, error: customError };
      }

      // Update last_login timestamp
      await supabase
        .from('client_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);

      setClientUser(clientUserData);
      return { data, error: null };
    }
    
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setClientUser(null);
    }
    return { error };
  };

  return {
    clientUser,
    loading,
    signIn,
    signOut,
  };
};
