import React, { createContext, useState, useEffect, ReactNode } from "react";
import { Appearance, ColorSchemeName } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeMode = ColorSchemeName | "light" | "dark" | "system";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  scheme: ColorSchemeName; // effectieve kleur
}

export const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  setMode: () => {},
  scheme: Appearance.getColorScheme() || "light",
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [scheme, setScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme() || "light"
  );

  // Bij opstarten: load voorkeur
  useEffect(() => {
    AsyncStorage.getItem("@theme_mode").then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "system") {
        setMode(saved);
      }
    });
  }, []);

  // Wanneer mode verandert: sla op + bereken effectieve scheme
  useEffect(() => {
    AsyncStorage.setItem("@theme_mode", mode);
    if (mode === "system") {
      const sys = Appearance.getColorScheme() || "light";
      setScheme(sys);
    } else {
      setScheme(mode);
    }
  }, [mode]);

  // Als system-mode en OS verandert:
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      if (mode === "system") {
        setScheme(colorScheme || "light");
      }
    });
    return () => sub.remove();
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, scheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
