"use client";

import { useTheme } from "next-themes";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  applyChartThemeVars,
  resolveChartThemeModeFromElement,
} from "@/lib/apply-chart-theme-vars";
import {
  getChartThemeIdFromDocumentCookie,
  setChartThemeCookie,
} from "@/lib/chart-theme-cookie";
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
  const hasSyncedCookieRef = useRef(false);
  const theme = getChartTheme(themeId);

  const setThemeId = useCallback((id: string) => {
    const nextTheme = getChartTheme(id);
    setThemeIdState(nextTheme.id);
    setChartThemeCookie(nextTheme.id);
  }, []);

  useEffect(() => {
    if (!hasSyncedCookieRef.current) {
      hasSyncedCookieRef.current = true;
      if (
        process.env.NODE_ENV === "production" &&
        "serviceWorker" in navigator
      ) {
        const registerSw = () => {
          navigator.serviceWorker
            .register("/sw.js", { scope: "/" })
            .catch(() => undefined);
        };
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(registerSw, { timeout: 3000 });
        } else {
          setTimeout(registerSw, 1500);
        }
      }
      const cookieThemeId = getChartThemeIdFromDocumentCookie();
      if (cookieThemeId && cookieThemeId !== themeId) {
        setThemeIdState(cookieThemeId);
        return;
      }
    }
    const rootMode =
      resolvedTheme === "dark" || resolvedTheme === "light"
        ? resolvedTheme
        : resolveChartThemeModeFromElement(document.documentElement);
    applyChartThemeVars(theme, { rootMode });

    const themeColorMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );
    if (themeColorMeta) {
      themeColorMeta.content = rootMode === "dark" ? "#09090b" : "#ffffff";
    }
  }, [theme, themeId, resolvedTheme]);

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
