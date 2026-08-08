import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useConvex, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

type User = {
  _id: Id<"users">;
  email: string;
  name: string;
  role: "student" | "admin";
  isPremium: boolean;
  avatarUrl?: string;
  streak: number;
  totalTestsTaken: number;
};

type AuthResult = { ok: boolean; error?: string };

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loginMutation = useMutation(api.users.login);
  const registerMutation = useMutation(api.users.register);
  const convex = useConvex();

  useEffect(() => {
    AsyncStorage.getItem("user").then((stored) => {
      if (stored) setUser(JSON.parse(stored));
      setIsLoading(false);
    });
  }, []);

  // Keep the logged-in user in sync with the database (premium status, streak,
  // tests taken) so changes made server-side reflect immediately without re-login.
  const liveProfile = useQuery(
    api.users.getProfile,
    user?._id ? { userId: user._id } : "skip"
  );

  useEffect(() => {
    if (!liveProfile) return;
    const effectivePremium =
      !!liveProfile.isPremium &&
      (!liveProfile.premiumExpiresAt || liveProfile.premiumExpiresAt > Date.now());
    setUser((prev) => {
      if (!prev || prev._id !== liveProfile._id) return prev;
      if (
        prev.isPremium === effectivePremium &&
        prev.streak === liveProfile.streak &&
        prev.totalTestsTaken === liveProfile.totalTestsTaken &&
        prev.name === liveProfile.name &&
        prev.avatarUrl === liveProfile.avatarUrl
      ) {
        return prev; // no change → avoid render loop
      }
      const merged = { ...prev, ...liveProfile, isPremium: effectivePremium } as User;
      AsyncStorage.setItem("user", JSON.stringify(merged)).catch(() => {});
      return merged;
    });
  }, [liveProfile]);

  const refreshUser = async () => {
    if (!user) return;
    try {
      const profile = await convex.query(api.users.getProfile, { userId: user._id });
      if (profile) {
        setUser(profile as User);
        await AsyncStorage.setItem("user", JSON.stringify(profile));
      }
    } catch {
      // ignore refresh errors
    }
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await loginMutation({ email: email.trim(), passwordHash: password });
      if (!result) return { ok: false, error: "Incorrect email or password. Please try again." };
      setUser(result as User);
      await AsyncStorage.setItem("user", JSON.stringify(result));
      return { ok: true };
    } catch {
      return { ok: false, error: "Couldn't reach the server. Check your internet connection." };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<AuthResult> => {
    try {
      await registerMutation({ email: email.trim(), name, passwordHash: password });
      return await login(email, password);
    } catch (e) {
      const msg = (e as Error)?.message ?? "";
      if (msg.toLowerCase().includes("already registered")) {
        return { ok: false, error: "This email is already registered. Please log in instead." };
      }
      return { ok: false, error: "Couldn't create your account. Please try again." };
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
