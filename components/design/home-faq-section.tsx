"use client";

import { useState } from "react";
import { GridCornerDots } from "@/components/design/line-grid";
import { DesignSectionHeader } from "@/components/design/section-header";
import { cn } from "@/lib/utils";

import { HOME_FAQ_ITEMS } from "@/lib/faq-data";


export function HomeFaqSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section
      aria-labelledby="faq-heading"
      className="relative w-full pt-12 md:pt-24"
    >
      <div className="container mx-auto w-full overflow-visible">
        <DesignSectionHeader
          subtitle="Architecture, container isolation, DeepSeek Harness persistence, and GitHub broker runtime"
          title="Frequently asked questions"
          titleId="faq-heading"
        />

        <div className="relative flex w-full flex-col overflow-visible border border-border bg-white dark:bg-black">
          <div className="divide-y divide-dashed divide-border">
            {HOME_FAQ_ITEMS.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div
                  className="relative overflow-visible transition-colors hover:bg-muted/20"
                  key={item.id}
                >
                  <button
                    aria-expanded={isOpen}
                    className="flex w-full items-start justify-between gap-4 px-5 py-6 text-left sm:px-8 sm:py-7"
                    onClick={() =>
                      setOpenId((prev) => (prev === item.id ? null : item.id))
                    }
                    type="button"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="w-16 border border-border bg-muted/30 px-2 py-0.5 text-center font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                          {item.code}
                        </span>
                        <span className="w-28 border border-border/60 bg-muted/20 px-2 py-0.5 text-center font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>
                      <h3 className="font-semibold text-base text-foreground tracking-tight sm:text-lg">
                        {item.question
                          .split(/(`[^`]+`)/g)
                          .map((part, index) => {
                            if (part.startsWith("`") && part.endsWith("`")) {
                              return (
                                <code
                                  className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-[13px] text-foreground"
                                  // biome-ignore lint/suspicious/noArrayIndexKey: pure text parts
                                  key={index}
                                >
                                  {part.slice(1, -1)}
                                </code>
                              );
                            }
                            return part;
                          })}
                      </h3>
                    </div>

                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center border border-border bg-muted/30 font-mono text-foreground text-sm transition-transform duration-200",
                        isOpen && "rotate-45 bg-foreground text-background"
                      )}
                    >
                      +
                    </span>
                  </button>

                  {isOpen ? (
                    <div className="border-border/60 border-t border-dashed bg-muted/10 px-5 pt-4 pb-6 sm:px-8 sm:pb-7">
                      <p className="w-full text-muted-foreground text-sm leading-relaxed">
                        {item.answer.split(/(`[^`]+`)/g).map((part, index) => {
                          if (part.startsWith("`") && part.endsWith("`")) {
                            return (
                              <code
                                className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-[13px] text-foreground"
                                // biome-ignore lint/suspicious/noArrayIndexKey: pure text parts
                                key={index}
                              >
                                {part.slice(1, -1)}
                              </code>
                            );
                          }
                          return part;
                        })}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <GridCornerDots className="z-3" columns={1} rows={1} />

          {/* Blueprint Grid Rulers & Hatch Corners */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
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
        </div>
      </div>
    </section>
  );
}
