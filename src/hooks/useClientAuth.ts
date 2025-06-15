
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

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
    const handleAuthChange = async (session: Session | null) => {
      try {
        if (session?.user) {
          const { data: clientUserData, error } = await supabase
            .from('client_users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            // This is expected if a non-client user is logged in.
            // We can log it for debugging but it's not a critical error.
            console.log('Could not fetch client user:', error.message);
            setClientUser(null);
          } else {
            setClientUser(clientUserData);
          }
        } else {
          setClientUser(null);
        }
      } catch (e) {
        const error = e as Error;
        console.error('Error in handleAuthChange:', error.message);
        setClientUser(null);
      } finally {
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await handleAuthChange(session);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
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
