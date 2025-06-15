
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, AuthError, AuthResponse } from '@supabase/supabase-js';

interface ClientUser {
  id: string;
  client_id: string;
  email: string;
  is_active: boolean;
  last_login: string | null;
}

interface ClientAuthContextType {
  clientUser: ClientUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export const ClientAuthProvider = ({ children }: { children: ReactNode }) => {
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
    return supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    clientUser,
    loading,
    signIn,
    signOut,
  };

  return <ClientAuthContext.Provider value={value}>{children}</ClientAuthContext.Provider>;
};

export const useClientAuth = () => {
  const context = useContext(ClientAuthContext);
  if (context === undefined) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
};
