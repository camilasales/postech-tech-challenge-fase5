import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppUser, ProfileEditablePayload } from '@/types/user';

const STORAGE_KEY = '@postech/auth_user';

type AuthContextValue = {
  user: AppUser | null;
  initializing: boolean;
  signIn: (user: AppUser) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateProfile: (payload: ProfileEditablePayload) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as AppUser;
          if (parsed?.id && parsed?.email) setUser(parsed);
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (next: AppUser) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setUser(next);
  }, []);

  const signOutUser = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (payload: ProfileEditablePayload) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next: AppUser = {
        ...prev,
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        address: payload.address.trim(),
      };
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      signIn,
      signOutUser,
      updateProfile,
    }),
    [user, initializing, signIn, signOutUser, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
