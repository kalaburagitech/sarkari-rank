"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

type AdminUser = {
  _id: Id<"users">;
  email: string;
  name: string;
  role: "student" | "admin";
};

type AdminAuthContextType = {
  admin: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);
const STORAGE_KEY = "sarkarirank_admin";

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loginMutation = useMutation(api.users.login);

  useEffect(() => {
    // One-time hydration of the persisted session from localStorage on mount.
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setAdmin(JSON.parse(stored));
    } catch {}
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await loginMutation({ email, passwordHash: password });
      if (!result) return { ok: false, error: "Invalid email or password" };
      if (result.role !== "admin") return { ok: false, error: "Access denied. Admin only." };
      const adminUser = result as AdminUser;
      setAdmin(adminUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser));
      return { ok: true };
    } catch {
      return { ok: false, error: "Connection failed. Check Convex URL." };
    }
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
