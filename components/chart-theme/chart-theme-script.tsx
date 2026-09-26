import { DEFAULT_CHART_THEME_ID, getChartTheme } from "@/lib/chart-themes";
import {
  CHART_THEME_VAR_NAMES,
  type ChartThemeVarName,
} from "@/lib/chart-themes/types";

function formatCssVarsBlock(
  selector: string,
  vars: Partial<Record<ChartThemeVarName, string>>
) {
  const declarations: string[] = [];

  for (const name of CHART_THEME_VAR_NAMES) {
    const value = vars[name];
    if (value !== undefined) {
      declarations.push(`--${name}:${value};`);
    }
  }

  if (declarations.length === 0) {
    return "";
  }

  return `${selector}{${declarations.join("")}}`;
}

function buildChartThemeCss(themeId: string) {
  const theme = getChartTheme(themeId);
  const lightRule = formatCssVarsBlock(":root", theme.light);
  const darkRule = formatCssVarsBlock(":root.dark", theme.dark);
  return `${lightRule}${darkRule}`;
}

export function ChartThemeScript({
  themeId = DEFAULT_CHART_THEME_ID,
}: {
  themeId?: string;
}) {
  const cssText = buildChartThemeCss(themeId);

  return <style id="aiws-chart-theme">{cssText}</style>;
}
