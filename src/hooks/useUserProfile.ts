import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

interface UserProfileHook {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export function useUserProfile(): UserProfileHook {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }
        setSession(session);

        if (session) {
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            throw profileError;
          }
          setProfile(data);
        } else {
          setProfile(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user profile');
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    getSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        // Re-fetch profile if session changes (e.g., after login/signup)
        getSessionAndProfile();
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { session, profile, loading, error };
}
