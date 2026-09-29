"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CadGridFrame({
  children,
  className,
  showRulers = true,
  showDots = true,
}: {
  children: ReactNode;
  className?: string;
  showRulers?: boolean;
  showDots?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex w-full min-w-0 max-w-full flex-col overflow-visible border-border border-t border-l",
        className
      )}
    >
      {children}

      {/* 4 Corner Crosshair Intersection Dots */}
      {showDots && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-3">
          <span className="absolute top-0 left-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-white sm:size-3 dark:bg-background" />
          <span className="absolute top-0 left-full size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-white sm:size-3 dark:bg-background" />
          <span className="absolute top-full left-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-white sm:size-3 dark:bg-background" />
          <span className="absolute top-full left-full size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-white sm:size-3 dark:bg-background" />
        </div>
      )}

      {/* Blueprint Grid Rulers & Diagonal Striped Hatch Corners */}
      {showRulers && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 hidden md:block"
          data-grid-rulers
        >
          <div className="absolute -top-8 left-0 block h-10 w-px bg-muted-foreground/40" />
          <div className="absolute top-0 -left-8 block h-px w-10 bg-muted-foreground/40" />
          <div className="absolute -top-8 right-0 block h-10 w-px bg-muted-foreground/40" />
          <div className="absolute top-0 -right-8 block h-px w-10 bg-muted-foreground/40" />

          <div className="absolute -bottom-8 left-0 block h-10 w-px bg-muted-foreground/40" />
          <div className="absolute bottom-0 -left-8 block h-px w-10 bg-muted-foreground/40" />
          <div className="absolute right-0 -bottom-8 block h-10 w-px bg-muted-foreground/40" />
          <div className="absolute -right-8 bottom-0 block h-px w-10 bg-muted-foreground/40" />

          <div className="absolute -top-8 -right-8 block h-6 w-6 bg-[repeating-linear-gradient(45deg,color-mix(in_oklch,var(--muted-foreground)_40%,transparent)_0,color-mix(in_oklch,var(--muted-foreground)_40%,transparent)_1px,transparent_0,transparent_50%)] bg-size-[5px_5px] bg-fixed opacity-80" />
          <div className="absolute -bottom-8 -left-8 block h-6 w-6 bg-[repeating-linear-gradient(45deg,color-mix(in_oklch,var(--muted-foreground)_40%,transparent)_0,color-mix(in_oklch,var(--muted-foreground)_40%,transparent)_1px,transparent_0,transparent_50%)] bg-size-[5px_5px] bg-fixed opacity-80" />
        </div>
      )}
    </div>
  );
}

export function CadCell({
  index,
  title,
  subtitle,
  headerAction,
  footerLeft,
  footerRight,
  className,
  bodyClassName,
  children,
}: {
  index: string;
  title: string;
  subtitle?: string;
  headerAction?: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  const resolvedFooterLeft = footerLeft ?? subtitle;

  return (
    <div
      className={cn(
        "flex w-full min-w-0 max-w-full flex-col justify-between border-border border-r border-b bg-white dark:bg-black",
        className
      )}
    >
      {/* Single-Line CAD Header Bar (min-h-11) */}
      <div className="flex min-h-11 w-full min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-border/60 border-b bg-card/30 px-3.5 py-2.5 sm:flex-nowrap sm:px-4 sm:py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50 tabular-nums">
            [{index}]
          </span>
          <h4 className="line-clamp-2 font-bold text-foreground text-sm leading-snug tracking-tight sm:truncate">
            {title}
          </h4>
        </div>
        {headerAction && (
          <div className="flex shrink-0 items-center gap-1.5 sm:ml-auto">
            {headerAction}
          </div>
        )}
      </div>

      {/* Cell Body (flex-1 so side-by-side cells stretch evenly) */}
      <div
        className={cn(
          "flex flex-1 flex-col min-w-0 w-full",
          bodyClassName?.includes("p-0")
            ? bodyClassName
            : cn("p-3.5 sm:p-5", bodyClassName)
        )}
      >
        {children}
      </div>

      {/* Full-Bleed CAD Footer Bar (h-9) */}
      {(resolvedFooterLeft || footerRight) && (
        <div className="flex min-h-9 w-full min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 border-border/60 border-t bg-muted/10 px-3.5 py-1.5 font-mono text-[9px] text-muted-foreground/60 sm:h-9 sm:flex-nowrap sm:px-4 sm:py-0 sm:text-[10px]">
          <span className="min-w-0 flex-1 truncate">{resolvedFooterLeft}</span>
          <span className="shrink-0">{footerRight}</span>
        </div>
      )}
    </div>
  );
}
