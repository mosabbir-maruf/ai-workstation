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
import { cn } from "@/lib/utils";

import { JsonLd } from "@/components/seo/json-ld";
import {
  createMetadata,
  getOrganizationSchema,
  getSoftwareApplicationSchema,
  getWebSiteSchema,
} from "@/lib/seo";

export const metadata: Metadata = createMetadata();

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
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
        <ChartThemeScript />
        <SiteLeftDotGrid />
        <RootProvider
          search={{
            SearchDialog: DocsSearchDialog,
            preload: false,
          }}
          theme={{
            defaultTheme: "light",
            enableSystem: false,
            storageKey: "aiws-theme",
          }}
        >
          <ChartThemeProvider>
            {children}
          </ChartThemeProvider>
        </RootProvider>
      </body>
    </html>
  );
}
