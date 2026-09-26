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
}) {
  return (
    <div
      className={cn(
        "relative flex w-full flex-col overflow-visible border-border border-t border-l",
        className
      )}
    >
      {children}
      {showRulers && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-px right-0 bottom-0 -left-px -z-10 hidden md:block"
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
        "flex min-w-0 flex-col justify-between border-border border-r border-b bg-white dark:bg-black",
        className
      )}
    >
      {/* Single-Line CAD Header Bar (min-h-11) */}
      <div className="flex min-h-11 items-center justify-between gap-3 border-border/60 border-b bg-card/30 px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50 tabular-nums">
            [{index}]
          </span>
          <h4 className="truncate font-bold text-foreground text-sm tracking-tight">
            {title}
          </h4>
        </div>
        {headerAction && (
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {headerAction}
          </div>
        )}
      </div>

      {/* Cell Body (flex-1 so side-by-side cells stretch evenly) */}
      <div
        className={cn(
          "flex flex-1 flex-col p-5",
          bodyClassName === "p-0" ? "p-5" : bodyClassName
        )}
      >
        {children}
      </div>

      {/* Full-Bleed CAD Footer Bar (h-9) */}
      {(resolvedFooterLeft || footerRight) && (
        <div className="flex h-9 items-center justify-between gap-2 border-border/60 border-t bg-muted/10 px-4 font-mono text-[10px] text-muted-foreground/60">
          <span className="truncate">{resolvedFooterLeft}</span>
          <span className="shrink-0">{footerRight}</span>
        </div>
      )}
    </div>
  );
}
