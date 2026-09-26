"use client";

import Link from "next/link";
import type { SVGProps } from "react";
import { GridCornerDots } from "@/components/design/line-grid";
import { DesignSectionHeader } from "@/components/design/section-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function ArrowUpRightIcon(props: SVGProps<SVGSVGElement>) {
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

function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

interface WorkflowStep {
  step: string;
  code: string;
  stageLabel: string;
  duration: string;
  title: string;
  description: string;
  terminalTitle: string;
  terminalLines: {
    prefix: string;
    content: string;
    highlight?: "emerald" | "amber" | "sky" | "muted";
  }[];
  checkpoints: string[];
  footerLeft: string;
  footerRight: string;
}

const workflowSteps: WorkflowStep[] = [
  {
    step: "01",
    code: "STEP-01",
    stageLabel: "STAGE_01 // INSTALL",
    duration: "T+02:00m",
    title: "Clone & Run the Installer",
    description:
      "Clone the repository onto your Linux VPS and run the install script. It validates Docker, Git, and Python, wires up runtime directories, and symlinks the `ai` CLI globally.",
    terminalTitle: "bash — install",
    terminalLines: [
      {
        prefix: "$",
        content:
          "git clone https://github.com/mosabbir-maruf/ai-workstation.git ~/ai-workstation",
        highlight: "muted",
      },
      {
        prefix: "$",
        content: "./install.sh",
        highlight: "muted",
      },
      {
        prefix: "✓",
        content: "Docker found",
        highlight: "emerald",
      },
      {
        prefix: "✓",
        content: "ai CLI → /usr/local/bin/ai",
        highlight: "emerald",
      },
      {
        prefix: "✓",
        content: "GitHub authentication: READY",
        highlight: "sky",
      },
    ],
    checkpoints: [
      "Runs on any Linux VPS — amd64 & arm64",
      "No root access required inside the container",
    ],
    footerLeft: "RUNTIME // DOCKER + PYTHON VENV",
    footerRight: "NEXT -> STAGE_02",
  },
  {
    step: "02",
    code: "STEP-02",
    stageLabel: "STAGE_02 // START",
    duration: "T+00:30s",
    title: "Add a Project & Start the Workstation",
    description:
      "Add any GitHub repository with `ai add`, select it with `ai use`, then spin up the isolated Docker workstation. Switch projects any time — no image rebuild needed.",
    terminalTitle: "bash — workstation",
    terminalLines: [
      {
        prefix: "$",
        content: "ai add https://github.com/you/my-app",
        highlight: "muted",
      },
      {
        prefix: "✓",
        content: "Cloned → ~/projects/my-app",
        highlight: "emerald",
      },
      {
        prefix: "$",
        content: "ai use my-app && ai start",
        highlight: "muted",
      },
      {
        prefix: "✓",
        content: "Workstation running (sandbox UID 1001)",
        highlight: "emerald",
      },
      {
        prefix: "$",
        content: "ai run",
        highlight: "muted",
      },
      {
        prefix: "✓",
        content: "Dev server ready · Bind: auto (--host 0.0.0.0)",
        highlight: "sky",
      },
    ],
    checkpoints: [
      "Active project mounts at /workspace — others stay untouched",
      "Container is memory & CPU limited — IDE never starved",
    ],
    footerLeft: "CONTAINER // SANDBOX UID 1001",
    footerRight: "NEXT -> STAGE_03",
  },
  {
    step: "03",
    code: "STEP-03",
    stageLabel: "STAGE_03 // DEVELOP",
    duration: "REAL-TIME",
    title: "Code with DSH, Preview from Anywhere",
    description:
      "Start DeepSeek Harness for AI-assisted coding. Use `ai preview` for instant SSH-tunnel access, or enable Cloudflare Tunnel to reach your app and DSH from any browser.",
    terminalTitle: "bash — preview",
    terminalLines: [
      {
        prefix: "$",
        content: "ai harness start",
        highlight: "muted",
      },
      {
        prefix: "✓",
        content: "DSH running → 127.0.0.1:4090",
        highlight: "emerald",
      },
      {
        prefix: "$",
        content: "ai preview",
        highlight: "muted",
      },
      {
        prefix: "›",
        content: "Detected app port(s): 5173",
        highlight: "sky",
      },
      {
        prefix: "›",
        content: "App  → http://127.0.0.1:5173",
        highlight: "emerald",
      },
      {
        prefix: "›",
        content: "DSH  → http://127.0.0.1:4090",
        highlight: "emerald",
      },
    ],
    checkpoints: [
      "SSH tunnel by default — zero public attack surface",
      "Cloudflare Tunnel opt-in for anywhere access, no VPN",
    ],
    footerLeft: "HARNESS // DSH 127.0.0.1:4090",
    footerRight: "STATUS: OPERATIONAL",
  },
];

const architectureNodes = [
  {
    id: "NODE_01",
    label: "HOST CLI",
    detail: "ai · Docker · Git",
  },
  {
    id: "NODE_02",
    label: "WORKSTATION",
    detail: "sandbox UID · /workspace",
  },
  {
    id: "NODE_03",
    label: "GITHUB BROKER",
    detail: "App auth · Unix socket",
  },
  {
    id: "NODE_04",
    label: "PREVIEW / DSH",
    detail: "SSH tunnel · Cloudflare",
  },
];

function getLineHighlightClass(
  highlight?: "emerald" | "amber" | "sky" | "muted"
) {
  switch (highlight) {
    case "emerald":
      return "text-emerald-600 dark:text-emerald-400";
    case "amber":
      return "text-amber-600 dark:text-amber-400";
    case "sky":
      return "text-sky-600 dark:text-sky-400";
    case "muted":
      return "text-muted-foreground";
    default:
      return "text-foreground";
  }
}

export function HomeHowItWorksSection() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="relative w-full pt-12 md:pt-24"
    >
      <div className="container mx-auto w-full overflow-visible">
        <DesignSectionHeader
          subtitle="One VPS, one CLI, one isolated container — your AI dev environment up in minutes"
          title="How it works"
          titleId="how-it-works-heading"
        />

        <div className="relative flex w-full flex-col overflow-visible border-border border-t border-l">
          {/* Row 1: 3-Stage Pipeline */}
          <div className="relative w-full overflow-visible">
            <div className="grid grid-cols-1 overflow-visible lg:grid-cols-3">
              {workflowSteps.map((item) => (
                <div
                  className="relative flex min-w-0 flex-col justify-between overflow-visible border-border border-r border-b bg-white dark:bg-black"
                  key={item.code}
                >
                  {/* CAD Header Bar */}
                  <div className="flex min-h-11 items-center justify-between gap-3 border-border/60 border-b bg-card/30 px-4 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground/60 tabular-nums">
                        [{item.code}]
                      </span>
                      <span className="truncate font-mono text-[11px] text-foreground/80 uppercase tracking-wider">
                        {item.stageLabel}
                      </span>
                    </div>
                    <span className="shrink-0 rounded border border-border/80 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground tabular-nums">
                      {item.duration}
                    </span>
                  </div>

                  {/* Step Body */}
                  <div className="flex flex-1 flex-col justify-between gap-6 p-5 sm:p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-bold font-mono text-3xl text-foreground/90 tabular-nums tracking-tighter sm:text-4xl">
                          {item.step}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                          EXECUTION PHASE {item.step}/03
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-bold text-foreground text-lg tracking-tight">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Terminal */}
                    <div className="flex flex-col gap-4">
                      <div className="overflow-hidden rounded-md border border-border/80 bg-muted/20 dark:bg-zinc-950">
                        <div className="flex items-center justify-between border-border/60 border-b bg-muted/40 px-3 py-1.5 dark:bg-zinc-900/70">
                          <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-muted-foreground/30" />
                            <span className="size-2 rounded-full bg-muted-foreground/30" />
                            <span className="size-2 rounded-full bg-muted-foreground/30" />
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {item.terminalTitle}
                          </span>
                        </div>
                        <div className="space-y-1.5 p-3 font-mono text-xs leading-relaxed">
                          {item.terminalLines.map((line) => (
                            <div
                              className="flex items-start gap-2 overflow-x-auto"
                              key={line.content}
                            >
                              <span className="shrink-0 select-none text-muted-foreground/60">
                                {line.prefix}
                              </span>
                              <span
                                className={cn(
                                  "whitespace-nowrap",
                                  getLineHighlightClass(line.highlight)
                                )}
                              >
                                {line.content}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Checkpoints */}
                      <ul className="space-y-1.5">
                        {item.checkpoints.map((checkpoint) => (
                          <li
                            className="flex items-center gap-2 text-muted-foreground text-xs"
                            key={checkpoint}
                          >
                            <CheckCircleIcon className="size-3.5 shrink-0 text-emerald-500" />
                            <span>{checkpoint}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* CAD Footer Bar */}
                  <div className="flex h-9 items-center justify-between gap-2 border-border/60 border-t bg-muted/10 px-4 font-mono text-[10px] text-muted-foreground/60">
                    <span className="truncate">{item.footerLeft}</span>
                    <span className="shrink-0 text-foreground/70">
                      {item.footerRight}
                    </span>
                  </div>

                  <GridCornerDots
                    className="z-3 lg:hidden"
                    columns={1}
                    rows={1}
                  />
                </div>
              ))}
            </div>

            <GridCornerDots
              className="z-3 hidden lg:block"
              columns={3}
              rows={1}
            />
          </div>

          {/* Row 2: Architecture + CTA */}
          <div className="relative w-full overflow-visible">
            <div className="flex flex-col justify-between border-border border-r border-b bg-white dark:bg-black">
              <div className="flex min-h-11 items-center justify-between gap-3 border-border/60 border-b bg-card/30 px-4 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground/60 tabular-nums">
                    [SYS-FLOW]
                  </span>
                  <span className="truncate font-mono text-[11px] text-foreground/80 uppercase tracking-wider">
                    End-to-End Architecture
                  </span>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-emerald-600 uppercase tracking-widest dark:text-emerald-400">
                  ● ZERO CLOUD DEPENDENCY
                </span>
              </div>

              <div className="flex flex-col justify-between gap-6 p-5 sm:p-6 lg:flex-row lg:items-center">
                {/* 4-Node Schematic */}
                <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {architectureNodes.map((node, index) => (
                    <div
                      className="relative flex flex-col gap-1 rounded border border-border/80 bg-muted/15 px-3.5 py-2.5 dark:bg-muted/10"
                      key={node.id}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-muted-foreground/70">
                          {node.id}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground/50">
                          0{index + 1}
                        </span>
                      </div>
                      <span className="font-bold font-mono text-foreground text-xs tracking-tight">
                        {node.label}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {node.detail}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <Link
                    className={cn(
                      buttonVariants({ size: "default", variant: "default" }),
                      "font-mono text-xs uppercase tracking-wider"
                    )}
                    href="/workstation"
                  >
                    Open Console
                    <ArrowUpRightIcon className="ml-1.5 size-3.5" />
                  </Link>
                  <Link
                    className={cn(
                      buttonVariants({ size: "default", variant: "outline" }),
                      "font-mono text-xs uppercase tracking-wider"
                    )}
                    href="/docs"
                  >
                    Read the docs
                  </Link>
                </div>
              </div>
            </div>

            <GridCornerDots className="z-3" columns={1} rows={1} />
          </div>

          {/* Blueprint Grid Rulers */}
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
