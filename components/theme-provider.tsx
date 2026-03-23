"use client";

import { BTP_CONFIG } from "@/config/btp.config";
import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("btp-theme") as Theme;
    if (stored) setTheme(stored);
    else setTheme("dark");
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.style.setProperty("--btp-primary", BTP_CONFIG.couleurPrimaire);
    root.style.setProperty("--btp-secondary", BTP_CONFIG.couleurSecondaire);

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("btp-theme", theme);
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => setTheme((prev) => (prev === "light" ? "dark" : "light")), []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
