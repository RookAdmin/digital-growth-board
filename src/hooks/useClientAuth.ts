
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
    const getClientUser = async (session: Session | null) => {
      setLoading(true);
      if (!session?.user) {
        setClientUser(null);
        setLoading(false);
        return;
      }

      try {
        const { data: clientUserData, error } = await supabase
          .from('client_users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') { // Ignore "No rows found" error
          console.error("Error fetching client user:", error);
          setClientUser(null);
        } else {
          setClientUser(clientUserData as ClientUser | null);
        }
      } catch (error) {
        console.error("Error in getClientUser:", error);
        setClientUser(null);
      } finally {
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      getClientUser(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Use setTimeout to defer async call, per Supabase best practices
        setTimeout(() => getClientUser(session), 0);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, phone: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: phone,
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
