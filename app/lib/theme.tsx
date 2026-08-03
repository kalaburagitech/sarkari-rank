import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";
import { lightColors, darkColors, ThemeColors } from "../constants/theme";

export type ThemeMode = "light" | "dark" | "system";
const STORAGE_KEY = "sr_theme_mode";

type ThemeCtx = {
  mode: ThemeMode; // user preference
  scheme: "light" | "dark"; // resolved
  colors: ThemeColors;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
};

const Ctx = createContext<ThemeCtx | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  // Load saved preference once and apply it to NativeWind.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      const m = (saved as ThemeMode) ?? "system";
      setModeState(m);
      setColorScheme(m);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMode = useCallback(
    (m: ThemeMode) => {
      setModeState(m);
      setColorScheme(m); // drives NativeWind `dark:` classes
      AsyncStorage.setItem(STORAGE_KEY, m);
    },
    [setColorScheme]
  );

  const toggle = useCallback(() => {
    setMode(colorScheme === "dark" ? "light" : "dark");
  }, [colorScheme, setMode]);

  const scheme: "light" | "dark" = colorScheme === "dark" ? "dark" : "light";
  const colors = scheme === "dark" ? darkColors : lightColors;

  return (
    <Ctx.Provider value={{ mode, scheme, colors, setMode, toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Safe fallback so a component rendered outside the provider still works.
    return {
      mode: "light",
      scheme: "light",
      colors: lightColors,
      setMode: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}
