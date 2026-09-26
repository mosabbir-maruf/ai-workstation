"use client";

import Link from "fumadocs-core/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FooterNavLink } from "@/components/design/footer-nav-link";
import { AiwsLogo } from "@/components/icons/aiws-logo";

const documentationLinks = [
  { text: "Getting Started", href: "/docs" },
  { text: "Installation Guide", href: "/docs/installation" },
  { text: "CLI Reference", href: "/docs/cli-reference" },
  { text: "GitHub App Broker", href: "/docs/github-app-setup" },
  { text: "Cloudflare Tunnel", href: "/docs/cloudflare-tunnel" },
  { text: "Harness & DSH", href: "/docs/harness-and-dsh" },
  { text: "Cache & Storage", href: "/docs/cache-and-state" },
  { text: "Operations Runbook", href: "/docs/operations" },
  { text: "Security Architecture", href: "/docs/security" },
] as const;

const consoleMenuLinks = [
  { text: "System Overview", href: "/workstation?tab=overview" },
  { text: "Projects & Workspaces", href: "/workstation?tab=projects" },
  { text: "App Runtime", href: "/workstation?tab=app" },
  { text: "Live Preview", href: "/workstation?tab=preview" },
  { text: "Git Sync", href: "/workstation?tab=git" },
  { text: "GitHub App Broker", href: "/workstation?tab=github" },
  { text: "Cloudflare Tunnel", href: "/workstation?tab=tunnel" },
  { text: "Harness & DSH", href: "/workstation?tab=harness" },
  { text: "DSH Model Keys", href: "/workstation?tab=dsh-keys" },
  { text: "Maintenance & Doctor", href: "/workstation?tab=maintenance" },
  { text: "State Snapshots", href: "/workstation?tab=state" },
  { text: "Workstation Logs", href: "/workstation?tab=logs" },
] as const;

const communityLinks = [
  { text: "Console", href: "/workstation" },
  { text: "Documentation", href: "/docs" },
  { text: "FAQ", href: "/faq" },
  { text: "Contact", href: "/contact" },
  { text: "Security Policy", href: "/docs/security" },
  { text: "Contributing Guide", href: "/docs/contributing" },
  {
    text: "GitHub Repository",
    href: "https://github.com/mosabbir-maruf/ai-workstation",
    external: true,
  },
  {
    text: "Maintainer",
    href: "https://mosabbir.pages.dev",
    external: true,
  },
] as const;

export function HomeFooter() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoTheme = mounted && resolvedTheme === "dark" ? "dark" : "light";

  return (
    <footer className="relative w-full pt-16 pb-8 md:pt-24">
      <div className="container mx-auto w-full px-4">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand */}
          <div className="flex flex-col gap-4">
            <Link
              className="inline-flex w-fit items-center gap-2.5 no-underline transition-opacity hover:opacity-80"
              href="/"
            >
              <AiwsLogo size={28} theme={logoTheme} />
              <span className="font-semibold text-foreground text-lg tracking-tight">
                Ai Workstation
              </span>
            </Link>
          </div>

          {/* Column 2: Documentation */}
          <div className="flex flex-col gap-4">
            <p className="font-medium font-mono text-muted-foreground/50 text-xs uppercase tracking-widest">
              Documentation
            </p>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {documentationLinks.map((link) => (
                <li key={link.href}>
                  <FooterNavLink href={link.href} text={link.text} />
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Console Menus (Position 3 / Middle) */}
          <div className="flex flex-col gap-4">
            <p className="font-medium font-mono text-muted-foreground/50 text-xs uppercase tracking-widest">
              Console Menus
            </p>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {consoleMenuLinks.map((link) => (
                <li key={link.href}>
                  <FooterNavLink href={link.href} text={link.text} />
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Community & Support */}
          <div className="flex flex-col gap-4">
            <p className="font-medium font-mono text-muted-foreground/50 text-xs uppercase tracking-widest">
              Community & Support
            </p>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {communityLinks.map((link) => (
                <li key={link.href}>
                  <FooterNavLink
                    external={"external" in link ? link.external : undefined}
                    href={link.href}
                    text={link.text}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
