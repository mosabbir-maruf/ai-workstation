"use client";

import { useTheme } from "next-themes";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applyChartThemeVars,
  resolveChartThemeModeFromElement,
} from "@/lib/apply-chart-theme-vars";
import { setChartThemeCookie } from "@/lib/chart-theme-cookie";
import {
  chartThemes,
  DEFAULT_CHART_THEME_ID,
  getChartTheme,
} from "@/lib/chart-themes";
import type { ChartColorTheme } from "@/lib/chart-themes/types";

interface ChartThemeContextValue {
  themeId: string;
  theme: ChartColorTheme;
  themes: ChartColorTheme[];
  setThemeId: (id: string) => void;
}

const ChartThemeContext = createContext<ChartThemeContextValue | null>(null);

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const firstArg = args[0];
    if (
      typeof firstArg === "string" &&
      firstArg.includes(
        "Encountered a script tag while rendering React component"
      )
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

export function useChartTheme() {
  const context = useContext(ChartThemeContext);

  if (!context) {
    throw new Error("useChartTheme must be used within ChartThemeProvider");
  }

  return context;
}

export function ChartThemeProvider({
  children,
  initialThemeId = DEFAULT_CHART_THEME_ID,
}: {
  children: ReactNode;
  initialThemeId?: string;
}) {
  const { resolvedTheme } = useTheme();
  const [themeId, setThemeIdState] = useState(initialThemeId);
  const theme = getChartTheme(themeId);

  const applyCurrentTheme = useCallback(() => {
    const rootMode =
      resolvedTheme === "dark" || resolvedTheme === "light"
        ? resolvedTheme
        : resolveChartThemeModeFromElement(document.documentElement);

    applyChartThemeVars(theme, { rootMode });
  }, [theme, resolvedTheme]);

  const setThemeId = useCallback((id: string) => {
    const nextTheme = getChartTheme(id);
    setThemeIdState(nextTheme.id);
    setChartThemeCookie(nextTheme.id);

    const rootMode = resolveChartThemeModeFromElement(document.documentElement);
    applyChartThemeVars(nextTheme, { rootMode });
  }, []);

  useEffect(() => {
    applyCurrentTheme();
  }, [applyCurrentTheme]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      applyCurrentTheme();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [applyCurrentTheme]);

  const value = useMemo(
    () => ({
      themeId,
      theme,
      themes: chartThemes,
      setThemeId,
    }),
    [themeId, theme, setThemeId]
  );

  return (
    <ChartThemeContext.Provider value={value}>
      {children}
    </ChartThemeContext.Provider>
  );
}
