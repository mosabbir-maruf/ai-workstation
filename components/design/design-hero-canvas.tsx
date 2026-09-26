"use client";

import Link from "next/link";
import { HeroStudioPill } from "@/components/hero";
import { GitHubIcon } from "@/components/icons/github";
import { buttonVariants } from "@/components/ui/button";
import { SOCIAL_LINKS } from "@/lib/seo";
import { cn } from "@/lib/utils";

export function DesignHeroCanvas() {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex min-h-0 min-w-0 flex-col items-center justify-center px-4 text-center sm:px-6 md:px-8 lg:px-10"
      data-grid-fill
    >
      <div className="flex min-h-0 w-full flex-col items-center gap-6 text-center sm:gap-8 md:gap-10">
        <div className="pointer-events-auto hidden shrink-0 items-center justify-center gap-2 sm:flex">
          <HeroStudioPill />
        </div>

        <div className="flex w-full flex-col items-center gap-2 text-center sm:gap-3">
          <h1 className="w-full text-center font-black text-6xl tracking-wider sm:whitespace-nowrap sm:text-7xl sm:tracking-widest md:text-8xl lg:text-[7.5rem] xl:text-[9rem]">
            Ai Workstation
          </h1>
          <p className="mx-auto max-w-4xl text-center font-mono text-muted-foreground text-xs uppercase tracking-widest sm:text-base md:text-lg">
            Development environment & AI workstation control dashboard
            <span className="animate-caret-blink">_</span>
          </p>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3">
          <Link
            className={cn(buttonVariants({ size: "lg", variant: "default" }))}
            href="/workstation"
          >
            Launch console
          </Link>
          <Link
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            href="/docs"
          >
            Documentation
          </Link>
          <a
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            href={SOCIAL_LINKS.github}
            rel="noopener noreferrer"
            target="_blank"
          >
            <GitHubIcon className="size-4" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
}
