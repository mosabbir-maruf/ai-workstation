"use client";

import Link from "next/link";
import { type SVGProps, useMemo, useState } from "react";
import { GridPageHero } from "@/components/design/grid-page-hero";
import { HomeFooter } from "@/components/design/home-footer";
import { Button } from "@/components/ui/button";
import { CadCell, CadGridFrame } from "@/components/workstation/cad-primitives";

function ArrowUpRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M7 17L17 7M7 7h10v10" />
    </svg>
  );
}

function ChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Search(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

import {
  CATEGORIES,
  FAQ_ITEMS,
  type FaqCategory,
  type FaqItem as _FaqItem,
} from "@/lib/faq-data";


export default function FaqPage() {
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchesQuery =
        !query ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        (item.command?.toLowerCase().includes(query) ?? false);
      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAllVisible = () => {
    const next: Record<string, boolean> = {};
    for (const item of filteredItems) {
      next[item.id] = true;
    }
    setOpenIds(next);
  };

  const collapseAllVisible = () => {
    setOpenIds({});
  };

  return (
    <main className="flex flex-1 flex-col space-y-10 md:space-y-12">
      {/* Same Hero Pattern as Console (/workstation) */}
      <section className="relative w-full">
        <div className="container mx-auto w-full overflow-visible">
          <GridPageHero
            action={
              <Button
                onClick={() => {
                  document
                    .getElementById("faq-matrix")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                size="lg"
                variant="white"
              >
                Explore Knowledge Matrix
              </Button>
            }
            subtitle="Technical knowledge matrix, runtime architecture & CLI answers"
            title="FAQ"
          />
        </div>
      </section>

      {/* Main CAD Blueprint Content */}
      <section
        className="relative w-full space-y-10 pb-16 md:space-y-12 md:pb-24"
        id="faq-matrix"
      >
        <div className="container mx-auto w-full space-y-10 overflow-visible md:space-y-12">
          {/* 1. Filter & Telemetry Control Matrix */}
          <CadGridFrame showRulers>
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <CadCell
                className="lg:col-span-8"
                footerLeft="SEARCH BY KEYWORD, PORT, OR CLI SUBCOMMAND"
                footerRight={`${filteredItems.length} OF ${FAQ_ITEMS.length} SPECIFICATIONS MATCHED`}
                headerAction={
                  <div className="flex items-center gap-1.5">
                    <Button
                      className="h-6 rounded-none px-2.5 font-mono text-[10px] uppercase tracking-wider"
                      onClick={expandAllVisible}
                      size="xs"
                      variant="outline"
                    >
                      Expand All
                    </Button>
                    <Button
                      className="h-6 rounded-none px-2.5 font-mono text-[10px] uppercase tracking-wider"
                      onClick={collapseAllVisible}
                      size="xs"
                      variant="outline"
                    >
                      Collapse All
                    </Button>
                  </div>
                }
                index="F-01"
                title="Specification Filter & Search Matrix"
              >
                <div className="flex flex-col gap-4">
                  {/* Search Input */}
                  <div className="relative flex items-center">
                    <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
                    <input
                      aria-label="Search FAQ entries"
                      className="h-10 w-full border border-border bg-muted/20 pr-20 pl-10 font-mono text-foreground text-xs placeholder:text-muted-foreground focus:border-foreground/40 focus:bg-background focus:outline-none"
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter by keyword, CLI flag, port, or code (e.g. FAQ-04, 3001, dsh, pem)..."
                      type="text"
                      value={searchQuery}
                    />
                    {searchQuery ? (
                      <button
                        className="absolute right-2.5 border border-border bg-background px-2 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-wider hover:text-foreground"
                        onClick={() => setSearchQuery("")}
                        type="button"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>

                  {/* Category Selector Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {CATEGORIES.map((cat) => {
                      const active = selectedCategory === cat.id;
                      const count =
                        cat.id === "all"
                          ? FAQ_ITEMS.length
                          : FAQ_ITEMS.filter((i) => i.category === cat.id)
                              .length;
                      return (
                        <button
                          className={`inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-xs transition-colors ${
                            active
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-muted/20 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                          }`}
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          type="button"
                        >
                          <span className="text-[10px] opacity-70">
                            [{cat.code}]
                          </span>
                          <span>{cat.label}</span>
                          <span
                            className={`px-1.5 py-0.2 text-[10px] ${
                              active
                                ? "bg-background/20 text-background"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CadCell>

              <CadCell
                className="lg:col-span-4"
                footerLeft="AI-WORKSTATION RUNTIME BASELINE"
                footerRight="REV 2.1"
                index="F-02"
                title="Runtime Specification Telemetry"
              >
                <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                  <div className="border border-border bg-muted/15 p-3">
                    <div className="text-[10px] text-muted-foreground uppercase">
                      Control Port
                    </div>
                    <div className="mt-1 font-semibold text-foreground">
                      :3001 (HTTP/API)
                    </div>
                  </div>
                  <div className="border border-border bg-muted/15 p-3">
                    <div className="text-[10px] text-muted-foreground uppercase">
                      Preview Proxy
                    </div>
                    <div className="mt-1 font-semibold text-emerald-500">
                      :3000 (Auto-Proxy)
                    </div>
                  </div>
                  <div className="border border-border bg-muted/15 p-3">
                    <div className="text-[10px] text-muted-foreground uppercase">
                      LLM Providers
                    </div>
                    <div className="mt-1 font-semibold text-foreground">
                      8 Backends
                    </div>
                  </div>
                  <div className="border border-border bg-muted/15 p-3">
                    <div className="text-[10px] text-muted-foreground uppercase">
                      Token Rotation
                    </div>
                    <div className="mt-1 font-semibold text-foreground">
                      45m Auto-Sync
                    </div>
                  </div>
                </div>
              </CadCell>
            </div>
          </CadGridFrame>

          {/* 2. Accordion Specification Items */}
          <CadGridFrame showRulers>
            <CadCell
              bodyClassName="p-0"
              footerLeft="CLICK ANY ROW TO EXPAND CLI COMMANDS & ARCHITECTURE REFERENCES"
              footerRight="STATUS: VERIFIED"
              index="F-03"
              title="Frequently Asked Questions & Technical Specifications"
            >
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <p className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
                    [0 MATCHING SPECIFICATIONS FOUND]
                  </p>
                  <p className="max-w-md text-muted-foreground text-sm">
                    No FAQ entries matched &ldquo;{searchQuery}&rdquo;. Try
                    clearing your filter or inspecting the CLI Reference
                    documentation.
                  </p>
                  <Button
                    className="mt-1 rounded-none font-mono text-xs uppercase tracking-wider"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSearchQuery("");
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Reset Filters
                  </Button>
                </div>
              ) : (
                <div className="-m-5 divide-y divide-border">
                  {filteredItems.map((item) => {
                    const isOpen = Boolean(openIds[item.id]);
                    return (
                      <div
                        className="transition-colors hover:bg-muted/10"
                        key={item.id}
                      >
                        <button
                          aria-expanded={isOpen}
                          className="flex w-full items-start justify-between gap-4 p-5 text-left"
                          onClick={() => toggleItem(item.id)}
                          type="button"
                        >
                          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="w-16 border border-border bg-muted/30 px-2 py-0.5 text-center font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                                {item.code}
                              </span>
                              <span className="w-32 border border-border/60 bg-muted/20 px-2 py-0.5 text-center font-mono text-[10px] text-emerald-500 uppercase tracking-wider">
                                [{item.categoryLabel}]
                              </span>
                            </div>
                            <h2 className="min-w-0 font-semibold text-foreground text-sm tracking-tight sm:text-base">
                              {item.question}
                            </h2>
                          </div>
                          <span
                            className={`mt-0.5 flex size-7 shrink-0 items-center justify-center border border-border bg-muted/20 text-muted-foreground transition-transform duration-200 ${
                              isOpen ? "rotate-180 text-foreground" : ""
                            }`}
                          >
                            <ChevronDown className="size-4" />
                          </span>
                        </button>

                        {isOpen && (
                          <div className="border-border/60 border-t bg-muted/10 px-5 pt-4 pb-6">
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                              <div className="flex flex-col gap-4 lg:col-span-8">
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                  {item.answer}
                                </p>
                                {item.command && (
                                  <div className="flex flex-col gap-1.5">
                                    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                                      CLI VERIFICATION COMMAND
                                    </span>
                                    <pre className="overflow-x-auto border border-border bg-background px-3.5 py-2.5 font-mono text-emerald-500 text-xs">
                                      <code>$ {item.command}</code>
                                    </pre>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col justify-between gap-3 border border-border bg-background p-4 lg:col-span-4">
                                <div className="flex flex-col gap-1">
                                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                                    REFERENCE SPECIFICATION
                                  </span>
                                  <span className="font-medium text-foreground text-xs">
                                    Detailed runbook & configuration parameters
                                  </span>
                                </div>
                                {item.docHref && (
                                  <Link
                                    className="inline-flex w-fit items-center gap-1.5 border border-border bg-muted/30 px-3 py-1.5 font-mono text-foreground text-xs hover:bg-muted"
                                    href={item.docHref}
                                  >
                                    <span>
                                      {item.docLabel ?? "View Documentation"}
                                    </span>
                                    <ArrowUpRight className="size-3.5" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CadCell>
          </CadGridFrame>

          {/* 3. Escalation & Documentation Matrix */}
          <CadGridFrame showRulers>
            <div className="grid grid-cols-1 md:grid-cols-3">
              <CadCell
                footerLeft="COMPLETE ARCHITECTURE RUNBOOKS"
                footerRight="10 MODULES"
                index="F-04"
                title="Documentation & Guides"
              >
                <div className="flex flex-1 flex-col justify-between gap-4">
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Step-by-step guides for GitHub App setup, Cloudflare Tunnel
                    tokens, DSH model providers, and state backups.
                  </p>
                  <Link
                    className="inline-flex w-fit items-center gap-1.5 border border-border bg-muted/20 px-3 py-2 font-mono text-foreground text-xs uppercase tracking-wider hover:bg-muted"
                    href="/docs"
                  >
                    <span>Explore Docs</span>
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </CadCell>

              <CadCell
                footerLeft="STRUCTURED ISSUE & SUPPORT DISPATCH"
                footerRight="ONLINE"
                index="F-05"
                title="Contact & Issue Dispatch"
              >
                <div className="flex flex-1 flex-col justify-between gap-4">
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Need help with a custom container workflow or found a bug?
                    Reach the maintainer or open a structured GitHub issue.
                  </p>
                  <Link
                    className="inline-flex w-fit items-center gap-1.5 border border-border bg-foreground px-3 py-2 font-mono text-background text-xs uppercase tracking-wider hover:opacity-90"
                    href="/contact"
                  >
                    <span>Open Contact Console</span>
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </CadCell>

              <CadCell
                footerLeft="PRIVATE ADVISORY SLA"
                footerRight="< 72 HOURS"
                index="F-06"
                title="Security & Vulnerability Policy"
              >
                <div className="flex flex-1 flex-col justify-between gap-4">
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Report secret exposure, token handling, or tunnel isolation
                    flaws privately with a 72-hour acknowledgment guarantee.
                  </p>
                  <Link
                    className="inline-flex w-fit items-center gap-1.5 border border-border bg-muted/20 px-3 py-2 font-mono text-foreground text-xs uppercase tracking-wider hover:bg-muted"
                    href="/docs/security"
                  >
                    <span>Security Policy</span>
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </CadCell>
            </div>
          </CadGridFrame>
        </div>
      </section>

      <HomeFooter />
    </main>
  );
}
