"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChartThemeSelector } from "@/components/chart-theme/chart-theme-selector";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import { AiwsLogo } from "../icons/aiws-logo";
import { GitHubIcon } from "../icons/github";
import { TelegramIcon } from "../icons/telegram";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { DocsSearchTrigger } from "./docs-search-trigger";
import { NavLinkLabel } from "./nav-link-label";

interface NavLink {
  text: string;
  url: string;
  active?: "url" | "nested-url";
}

interface SiteHeaderProps {
  links?: NavLink[];
  githubUrl?: string;
  telegramUrl?: string;
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        className="origin-center transition-all duration-200"
        d={open ? "M18 6L6 18" : "M4 6h16"}
      />
      <path
        className="origin-center transition-all duration-200"
        d="M4 12h16"
        style={{ opacity: open ? 0 : 1 }}
      />
      <path
        className="origin-center transition-all duration-200"
        d={open ? "M6 6l12 12" : "M4 18h16"}
      />
    </svg>
  );
}

const STAGGER_DURATION = 650; // Total duration for all staggered items (ms)

const HEADER_SCROLL_THRESHOLD = 8;

function getScrollTop() {
  return (
    window.scrollY ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

function subscribeToScroll(onStoreChange: () => void) {
  window.addEventListener("scroll", onStoreChange, { passive: true });
  return () => window.removeEventListener("scroll", onStoreChange);
}

function getIsScrolled() {
  return getScrollTop() > HEADER_SCROLL_THRESHOLD;
}

function useIsScrolled() {
  return useSyncExternalStore(subscribeToScroll, getIsScrolled, () => false);
}

interface MobileMenuProps {
  links: NavLink[];
  githubUrl?: string;
  telegramUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  staggerDelay: number;
}

function MobileMenu({
  links,
  githubUrl,
  telegramUrl,
  isOpen,
  onClose,
  staggerDelay,
}: MobileMenuProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const getStaggerStyle = (index: number) => ({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? "translateY(0)" : "translateY(4px)",
    transitionDelay: isOpen ? `${index * staggerDelay}ms` : "0ms",
  });

  const externalLinksStartIndex = links.length;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`fixed inset-x-0 top-(--site-header-height) bottom-0 z-50 flex flex-col overflow-hidden border-border border-b bg-background transition-[transform,opacity] duration-300 ease-out md:hidden ${
          isOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-4 opacity-0"
        }`}
      >
        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch]">
          {/* Main links */}
          <div className="flex flex-col gap-0.5">
            {links.map((link, index) => (
              <Link
                className="transition-[opacity,transform] duration-300 ease-out"
                href={link.url}
                key={link.url}
                onClick={onClose}
                style={getStaggerStyle(index)}
              >
                <Button
                  className="h-10 w-full justify-start px-3"
                  size="default"
                  variant="ghost"
                >
                  <NavLinkLabel text={link.text} url={link.url} />
                </Button>
              </Link>
            ))}
          </div>

          {/* External links */}
          {(githubUrl || telegramUrl) && (
            <div className="mt-3 flex flex-col gap-0.5 border-border border-t pt-3">
              {githubUrl && (
                <Link
                  aria-label="GitHub"
                  className="transition-[opacity,transform] duration-300 ease-out"
                  href={githubUrl}
                  onClick={onClose}
                  rel="noopener noreferrer"
                  style={getStaggerStyle(externalLinksStartIndex)}
                  target="_blank"
                >
                  <Button
                    className="w-full justify-start gap-2 font-light font-mono text-muted-foreground text-xs"
                    size="default"
                    variant="ghost"
                  >
                    <GitHubIcon />
                    <span>GitHub</span>
                  </Button>
                </Link>
              )}
              {telegramUrl && (
                <Link
                  aria-label="Telegram"
                  className="transition-[opacity,transform] duration-300 ease-out"
                  href={telegramUrl}
                  onClick={onClose}
                  rel="noopener noreferrer"
                  style={getStaggerStyle(
                    externalLinksStartIndex + (githubUrl ? 1 : 0)
                  )}
                  target="_blank"
                >
                  <Button
                    className="w-full justify-start gap-2 font-mono text-muted-foreground text-xs"
                    size="default"
                    variant="ghost"
                  >
                    <TelegramIcon />
                    <span>Telegram</span>
                  </Button>
                </Link>
              )}
            </div>
          )}
        </nav>
      </div>
    </>
  );
}

export function SiteHeader({
  links = [],
  githubUrl,
  telegramUrl,
}: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isScrolled = useIsScrolled();
  const headerRef = useRef<HTMLElement>(null);
  const { resolvedTheme } = useTheme();

  // Calculate stagger delay based on total items to complete in STAGGER_DURATION
  const totalItems = links.length + (githubUrl ? 1 : 0) + (telegramUrl ? 1 : 0);
  const staggerDelay = totalItems > 1 ? STAGGER_DURATION / (totalItems - 1) : 0;

  // Wait for mount to avoid hydration mismatch with theme
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) {
      return;
    }

    const syncHeaderHeight = () => {
      document.documentElement.style.setProperty(
        "--site-header-height",
        `${header.getBoundingClientRect().height}px`
      );
    };

    syncHeaderHeight();
    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(header);

    return () => observer.disconnect();
  }, []);

  // Only use resolved theme after mount to avoid hydration mismatch
  const logoTheme = mounted && resolvedTheme === "dark" ? "dark" : "light";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 left-0 z-50 px-2.5",
          mobileMenuOpen && "max-md:bg-background"
        )}
        data-scrolled={isScrolled ? "" : undefined}
        ref={headerRef}
      >
        <div
          className={cn(
            "container mx-auto",
            mobileMenuOpen && "max-md:max-w-none"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between gap-6 py-4 transition-[transform,margin,border-color,background-color,box-shadow,backdrop-filter] duration-300 ease-out motion-reduce:transition-none",
              isScrolled
                ? "translate-y-4 border border-border bg-background/80 px-4 shadow-sm backdrop-blur-sm md:mx-14"
                : "translate-y-0 border border-transparent bg-transparent",
              mobileMenuOpen &&
                "max-md:mx-0 max-md:translate-y-0 max-md:border-transparent max-md:bg-background max-md:shadow-none max-md:backdrop-blur-none"
            )}
            style={{ viewTransitionName: "site-header" }}
          >
            <div className="flex items-center gap-2">
              <Link
                className="font-semibold text-foreground text-lg no-underline transition-opacity hover:opacity-80"
                href="/"
              >
                <AiwsLogo size={24} theme={logoTheme} />
              </Link>

              {/* Desktop nav */}
              <nav className="hidden items-center gap-1 md:flex">
                {links.map((link) => (
                  <Link href={link.url} key={link.url}>
                    <Button variant="ghost">
                      <NavLinkLabel text={link.text} url={link.url} />
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-1">
              <DocsSearchTrigger
                className="hidden w-[122px] justify-between md:inline-flex"
                hideIfDisabled
              />
              {githubUrl && (
                <>
                  <Separator
                    className="mx-1 hidden h-5 self-center data-vertical:self-center md:block"
                    orientation="vertical"
                  />
                  <Link
                    aria-label="GitHub"
                    className="hidden md:block"
                    href={githubUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Button className="gap-2" size="default" variant="ghost">
                      <GitHubIcon />
                    </Button>
                  </Link>
                </>
              )}
              {telegramUrl && (
                <Link
                  aria-label="Telegram"
                  className="hidden md:block"
                  href={telegramUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Button size="default" variant="ghost">
                    <TelegramIcon />
                  </Button>
                </Link>
              )}
              <ChartThemeSelector />
              <ModeToggle />

              {/* Mobile menu button */}
              <Button
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                size="default"
                variant="ghost"
              >
                <MenuIcon open={mobileMenuOpen} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu
        githubUrl={githubUrl}
        isOpen={mobileMenuOpen}
        links={links}
        onClose={() => setMobileMenuOpen(false)}
        staggerDelay={staggerDelay}
        telegramUrl={telegramUrl}
      />
    </>
  );
}
