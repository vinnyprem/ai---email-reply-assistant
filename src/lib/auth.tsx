import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { ensureProfile, upsertProfile } from './profile';
import { storeGoogleTokens } from './gmail';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
].join(' ');

async function captureGoogleTokens(sess: Session): Promise<boolean> {
  const providerToken = sess.provider_token;
  const providerRefreshToken = sess.provider_refresh_token;
  const expiresAt = sess.expires_at
    ? new Date(sess.expires_at * 1000).toISOString()
    : null;

  if (!providerToken) {
    const provider = sess.user?.app_metadata?.provider ?? 'unknown';
    if (provider === 'google') {
      console.warn(
        '[auth] Google session missing provider_token. ' +
          'The OAuth scopes may not include Gmail. Re-authorize with Gmail scopes.'
      );
    }
    return false;
  }

  const ok = await storeGoogleTokens({
    userId: sess.user.id,
    accessToken: providerToken,
    refreshToken: providerRefreshToken ?? null,
    expiresAt,
    scope: GMAIL_SCOPES,
  });

  if (ok) {
    await upsertProfile(sess.user.id, { gmail_connected: true });
  }
  return ok;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let captured = false;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) {
        (async () => {
          const meta = data.session!.user.user_metadata ?? {};
          await ensureProfile(data.session!.user.id, {
            full_name: meta.full_name ?? meta.name ?? '',
            avatar_url: meta.avatar_url ?? meta.picture ?? '',
            provider: data.session!.user.app_metadata?.provider ?? 'email',
          });
          const did = await captureGoogleTokens(data.session!);
          if (did) captured = true;
        })();
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        (async () => {
          const meta = sess.user.user_metadata ?? {};
          await ensureProfile(sess.user.id, {
            full_name: meta.full_name ?? meta.name ?? '',
            avatar_url: meta.avatar_url ?? meta.picture ?? '',
            provider: sess.user.app_metadata?.provider ?? 'email',
          });
          if (!captured) {
            const did = await captureGoogleTokens(sess);
            if (did) captured = true;
          }
        })();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const redirectTo = window.location.origin;

    const params = new URLSearchParams({
      provider: 'google',
      redirect_to: redirectTo,
      scopes: GMAIL_SCOPES,
    });

    window.location.href = `${supabaseUrl}/auth/v1/authorize?${params.toString()}`;
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
