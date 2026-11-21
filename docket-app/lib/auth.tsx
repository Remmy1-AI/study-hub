import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { supabase, supabaseConfigured } from '@/lib/supabase';

const MOCK_SESSION_KEY = 'docket.mock.session';

export type AuthUser = {
  id: string;
  phone: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  mockMode: boolean;
  /** Browse is always free; download + progress need a session. */
  requireAuthForAction: (action: 'download' | 'progress') => boolean;
  sendOtp: (phone: string) => Promise<{ ok: boolean; message: string }>;
  verifyOtp: (phone: string, token: string) => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizePhone(phone: string) {
  const trimmed = phone.trim().replace(/\s+/g, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) return trimmed;
  if (trimmed.startsWith('0') && trimmed.length === 10) {
    return `+233${trimmed.slice(1)}`;
  }
  return trimmed;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const mockMode = !supabaseConfigured;

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    async function hydrate() {
      try {
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          const sessionUser = data.session?.user;
          if (!cancelled && sessionUser) {
            setUser({
              id: sessionUser.id,
              phone: sessionUser.phone ?? sessionUser.email ?? 'signed-in',
            });
          }
          const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              setUser({
                id: session.user.id,
                phone: session.user.phone ?? session.user.email ?? 'signed-in',
              });
            } else {
              setUser(null);
            }
          });
          unsubscribe = () => sub.subscription.unsubscribe();
          return;
        }

        const raw = await AsyncStorage.getItem(MOCK_SESSION_KEY);
        if (!cancelled && raw) {
          setUser(JSON.parse(raw) as AuthUser);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const sendOtp = useCallback(async (phone: string) => {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      return { ok: false, message: 'Enter a valid phone number.' };
    }

    if (supabase) {
      const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
      if (error) return { ok: false, message: error.message };
      return { ok: true, message: 'OTP sent. Check your SMS.' };
    }

    return {
      ok: true,
      message: 'Code sent. Enter the 6-digit code to continue.',
    };
  }, []);

  const verifyOtp = useCallback(async (phone: string, token: string) => {
    const normalized = normalizePhone(phone);
    if (!normalized || !token.trim()) {
      return { ok: false, message: 'Phone and code are required.' };
    }

    if (supabase) {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: normalized,
        token: token.trim(),
        type: 'sms',
      });
      if (error) return { ok: false, message: error.message };
      const sessionUser = data.user;
      if (sessionUser) {
        setUser({
          id: sessionUser.id,
          phone: sessionUser.phone ?? normalized,
        });
      }
      return { ok: true, message: 'Signed in.' };
    }

    if (token.trim() !== '123456') {
      return { ok: false, message: 'Invalid code. Try again.' };
    }

    const mockUser: AuthUser = {
      id: `mock-${normalized}`,
      phone: normalized,
    };
    await AsyncStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockUser));
    setUser(mockUser);
    return { ok: true, message: 'Signed in.' };
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    await AsyncStorage.removeItem(MOCK_SESSION_KEY);
    setUser(null);
  }, []);

  const requireAuthForAction = useCallback(
    (_action: 'download' | 'progress') => !user,
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      mockMode,
      requireAuthForAction,
      sendOtp,
      verifyOtp,
      signOut,
    }),
    [user, loading, mockMode, requireAuthForAction, sendOtp, verifyOtp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
