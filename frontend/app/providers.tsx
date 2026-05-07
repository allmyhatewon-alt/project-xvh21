"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  image: string | null;
  bio: string | null;
  status: string | null;
  bannerUrl: string | null;
  accentColor: string;
  role: string;
  shards: number;
  gems: number;
  xp: number;
  level: number;
  streakCount: number;
  longestStreak: number;
  gemsUnlocked: boolean;
  onboarded: boolean;
};

type Ctx = {
  user: SessionUser | null | undefined; // undefined = loading
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Ctx>({
  user: undefined,
  refresh: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/auth/me", { cache: "no-store" });
      const d = await r.json();
      setUser(d.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, refresh, signOut }}>{children}</AuthContext.Provider>
  );
}
