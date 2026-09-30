"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CadGridFrame({
  children,
  className,
  showRulers = true,
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
      {showRulers && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-px right-0 bottom-0 -left-px -z-10 hidden md:block"
          data-grid-rulers
        >
          <div className="absolute -top-4 left-0 h-5 w-px bg-muted-foreground/35" />
          <div className="absolute top-0 -left-4 h-px w-5 bg-muted-foreground/35" />
          <div className="absolute -top-4 right-0 h-5 w-px bg-muted-foreground/35" />
          <div className="absolute top-0 -right-4 h-px w-5 bg-muted-foreground/35" />
          <div className="absolute -bottom-4 left-0 h-5 w-px bg-muted-foreground/35" />
          <div className="absolute bottom-0 -left-4 h-px w-5 bg-muted-foreground/35" />
          <div className="absolute right-0 -bottom-4 h-5 w-px bg-muted-foreground/35" />
          <div className="absolute -right-4 bottom-0 h-px w-5 bg-muted-foreground/35" />
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

export function WorkstationSpinner({
  label = "Loading Ai Workstation Console...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "flex min-h-[400px] w-full flex-col items-center justify-center gap-3 font-mono text-muted-foreground text-xs",
        className
      )}
      role="status"
    >
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-foreground"
      />
      <span className="tracking-wider">{label}</span>
    </div>
  );
}
