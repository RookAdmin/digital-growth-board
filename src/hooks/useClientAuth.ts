
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ClientUser {
  id: string;
  client_id: string;
  email: string;
  is_active: boolean;
  last_login: string | null;
}

export const useClientAuth = () => {
  const [clientUser, setClientUser] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Check if this is a client user
          const { data: clientUserData } = await supabase
            .from('client_users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (clientUserData) {
            setClientUser(clientUserData);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: clientUserData } = await supabase
            .from('client_users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (clientUserData) {
            setClientUser(clientUserData);
          }
        } else {
          setClientUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
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
