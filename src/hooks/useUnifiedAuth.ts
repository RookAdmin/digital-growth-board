import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

type UserType = 'client' | 'partner' | 'admin' | null;

interface UnifiedAuthState {
  user: User | null;
  userType: UserType;
  loading: boolean;
}

export const useUnifiedAuth = () => {
  const [authState, setAuthState] = useState<UnifiedAuthState>({
    user: null,
    userType: null,
    loading: true,
  });

  const detectUserType = async (userId: string): Promise<UserType> => {
    // Run all queries in parallel for better performance
    const [clientResult, partnerResult, teamResult] = await Promise.all([
      supabase.from('client_users').select('id').eq('id', userId).maybeSingle(),
      supabase.from('partners').select('id').eq('user_id', userId).maybeSingle(),
      supabase.from('team_members').select('id').eq('user_id', userId).maybeSingle(),
    ]);

    if (clientResult.data) return 'client';
    if (partnerResult.data) return 'partner';
    if (teamResult.data) return 'admin';

    return null;
  };

  useEffect(() => {
    let mounted = true;
    let initialCheckDone = false;

    // Check for existing session FIRST
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!mounted) return;
      
      if (session?.user) {
        const userType = await detectUserType(session.user.id);
        if (mounted) {
          setAuthState({
            user: session.user,
            userType,
            loading: false,
          });
        }
      } else {
        setAuthState({ user: null, userType: null, loading: false });
      }
      initialCheckDone = true;
    };

    initAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip if initial check hasn't completed to avoid duplicate calls
        if (!initialCheckDone || !mounted) return;
        
        if (session?.user) {
          const userType = await detectUserType(session.user.id);
          if (mounted) {
            setAuthState({
              user: session.user,
              userType,
              loading: false,
            });
          }
        } else {
          setAuthState({ user: null, userType: null, loading: false });
        }
      }
    );

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

    if (error) return { data: null, error, userType: null };

    if (data.user) {
      const userType = await detectUserType(data.user.id);
      if (!userType) {
        await supabase.auth.signOut();
        return {
          data: null,
          error: { message: 'User not found in any portal' },
          userType: null,
        };
      }
      return { data, error: null, userType };
    }

    return { data, error, userType: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setAuthState({ user: null, userType: null, loading: false });
    }
    return { error };
  };

  return {
    ...authState,
    signIn,
    signOut,
  };
};
