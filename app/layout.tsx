import { ChartThemeProvider } from "@/components/chart-theme/chart-theme-provider";
import "./globals.css";
import { RootProvider } from "fumadocs-ui/provider";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ChartThemeScript } from "@/components/chart-theme/chart-theme-script";
import { SiteLeftDotGrid } from "@/components/design/site-left-dot-grid";
import { DocsSearchDialog } from "@/components/docs/docs-search-dialog";
import { getChartThemeIdFromCookie } from "@/lib/chart-theme-cookie.server";
import { cn } from "@/lib/utils";

import { JsonLd } from "@/components/seo/json-ld";
import {
  createMetadata,
  getOrganizationSchema,
  getSoftwareApplicationSchema,
  getWebSiteSchema,
} from "@/lib/seo";

export const metadata: Metadata = createMetadata();


export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const chartThemeId = await getChartThemeIdFromCookie();

  return (
    <html
      className={cn(
        GeistSans.variable,
        GeistMono.variable,
        GeistSans.className
      )}
      lang="en"
      suppressHydrationWarning
    >
      <body className="relative flex min-h-screen flex-col">
        <JsonLd
          schema={[
            getOrganizationSchema(),
            getSoftwareApplicationSchema(),
            getWebSiteSchema(),
          ]}
        />
        <ChartThemeScript themeId={chartThemeId} />
        <SiteLeftDotGrid />
        <ChartThemeProvider initialThemeId={chartThemeId}>
          <RootProvider
            search={{
              SearchDialog: DocsSearchDialog,
            }}
          >
            {children}
          </RootProvider>
        </ChartThemeProvider>
      </body>
    </html>
  );
}
