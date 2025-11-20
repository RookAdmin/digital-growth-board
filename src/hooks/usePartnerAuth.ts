
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthError } from '@supabase/supabase-js';

interface Partner {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  service_categories: string[] | null;
  location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const usePartnerAuth = () => {
  const [partner, setPartner] = useState<Partner | null>(null);
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
              const { data: partnerData } = await supabase
                .from('partners')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();
              
              if (mounted && partnerData) {
                setPartner(partnerData);
              }
            } catch (error) {
              console.error('Error fetching partner:', error);
            } finally {
              if (mounted) setLoading(false);
            }
          }, 0);
        } else {
          setPartner(null);
          setLoading(false);
        }
      }
    );

    // Then check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session?.user) {
          const { data: partnerData } = await supabase
            .from('partners')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          if (partnerData) {
            setPartner(partnerData);
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

  const signUp = async (signUpData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    companyName?: string;
    country: string;
    state: string;
    city: string;
    address: string;
  }) => {
    const fullName = `${signUpData.firstName} ${signUpData.lastName}`.trim();

    const { data, error } = await supabase.auth.signUp({
      email: signUpData.email,
      password: signUpData.password,
      options: {
        data: {
          user_type: 'partner',
          full_name: fullName,
          phone: signUpData.phone,
          company_name: signUpData.companyName,
          country: signUpData.country,
          state: signUpData.state,
          city: signUpData.city,
        },
      },
    });

    if (!error && data.user?.id) {
      const { error: partnerInsertError } = await supabase.from('partners').insert({
        user_id: data.user.id,
        email: signUpData.email,
        full_name: fullName,
        first_name: signUpData.firstName,
        last_name: signUpData.lastName,
        phone: signUpData.phone,
        company_name: signUpData.companyName || null,
        country: signUpData.country,
        state: signUpData.state,
        city: signUpData.city,
        address: signUpData.address,
        location: [signUpData.city, signUpData.state, signUpData.country].filter(Boolean).join(', '),
        is_active: true,
      });

      if (partnerInsertError) {
        console.error('Error creating partner profile:', partnerInsertError);
      }
    }

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { data, error };
    }

    if (data.user) {
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
      
      if (partnerError || !partnerData) {
        await supabase.auth.signOut();
        const customError = new AuthError(
          'Access denied. You are not a registered partner.',
          401
        );
        setPartner(null);
        return { data: null, error: customError };
      }

      setPartner(partnerData);
      return { data, error: null };
    }
    
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setPartner(null);
    }
    return { error };
  };

  return {
    partner,
    loading,
    signUp,
    signIn,
    signOut,
  };
};
