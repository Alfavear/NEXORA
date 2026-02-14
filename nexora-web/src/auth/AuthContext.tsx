import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as AuthAPI from "../api/auth";

type AuthState = {
  token: string | null;
  me: AuthAPI.MeResponse | null;
  loading: boolean;
  login: (email: string, password: string, branchId?: number) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  switchBranch: (branchId: number) => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("access_token"));
  const [me, setMe] = useState<AuthAPI.MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    if (!localStorage.getItem("access_token")) {
      setMe(null);
      return;
    }
    const data = await AuthAPI.me();
    setMe(data);
  }

  useEffect(() => {
    (async () => {
      try {
        await refreshMe();
      } catch {
        localStorage.removeItem("access_token");
        setToken(null);
        setMe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string, branchId?: number) {
    const res = await AuthAPI.login({ email, password, branchId });
    localStorage.setItem("access_token", res.access_token);
    setToken(res.access_token);
    await refreshMe();
  }

  async function switchBranch(branchId: number) {
    const res = await AuthAPI.switchBranch(branchId);
    localStorage.setItem("access_token", res.access_token);
    setToken(res.access_token);
    await refreshMe();
  }

  function logout() {
    localStorage.removeItem("access_token");
    setToken(null);
    setMe(null);
  }

  const value = useMemo(
    () => ({ token, me, loading, login, logout, refreshMe, switchBranch }),
    [token, me, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
