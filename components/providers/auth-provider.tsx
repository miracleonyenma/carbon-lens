"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePersistedState } from "@/hooks/aevr/use-persisted-state";
import { create } from "zustand";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  payTag?: string;
  referredBy?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  kycVerified?: boolean;
}

interface AuthLoadingStore {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const useAuthLoading = create<AuthLoadingStore>((set) => ({
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),
}));

export function useAuth() {
  const router = useRouter();

  // Persisted user state using the custom Zustand backed hook
  const {
    state: user,
    setState: setUser,
    isHydrated,
  } = usePersistedState<User | null>(null, {
    storageKey: "auth-user",
  });

  const { isLoading, setIsLoading } = useAuthLoading();

  const fetchSession = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/v1/auth/session");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const currentUrl = window.location.pathname + window.location.search;
      await fetch("/api/v1/auth/logout", { method: "POST" });
      setUser(null);

      const loginUrl = new URL("/login", window.location.origin);
      if (currentUrl && currentUrl !== "/login" && currentUrl !== "/register") {
        loginUrl.searchParams.set("returnUrl", encodeURIComponent(currentUrl));
      }
      router.push(loginUrl.toString());
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return {
    user,
    isLoading: !isHydrated || isLoading,
    logout,
    refreshSession: fetchSession,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { refreshSession } = useAuth();

  // Automatically authenticate on mount and keep session fresh
  useEffect(() => {
    refreshSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
