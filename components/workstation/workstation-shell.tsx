"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GridCornerDots } from "@/components/design/line-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppSection } from "./sections/app-section";
import { DshKeysSection } from "./sections/dsh-keys-section";
import { GitSection } from "./sections/git-section";
import { GitHubSection } from "./sections/github-section";
import { HarnessSection } from "./sections/harness-section";
import { LogsSection } from "./sections/logs-section";
import { MaintenanceSection } from "./sections/maintenance-section";
import { OverviewSection } from "./sections/overview-section";
import { PreviewSection } from "./sections/preview-section";
import { ProjectsSection } from "./sections/projects-section";
import { StateSection } from "./sections/state-section";
import { TerminalSection } from "./sections/terminal-section";
import { TunnelSection } from "./sections/tunnel-section";
import { WorkstationSetupFlow } from "./workstation-setup-flow";
import { workstationApi } from "@/lib/workstation/api";

export const WORKSTATION_GROUPS = [
  {
    category: "Control Plane",
    items: [
      { id: "overview", label: "Overview", index: "01", tag: "System" },
      { id: "terminal", label: "Remote Terminal", index: "02", tag: "CLI" },
      { id: "app", label: "App Runtime", index: "03", tag: "Runtime" },
      { id: "preview", label: "Live Preview", index: "04", tag: "Ingress" },
    ],
  },
  {
    category: "Workspace & VCS",
    items: [
      { id: "projects", label: "Projects", index: "05", tag: "Workspace" },
      { id: "git", label: "Git Sync", index: "06", tag: "VCS" },
      { id: "github", label: "GitHub App", index: "07", tag: "Integration" },
    ],
  },
  {
    category: "Edge & AI Agent",
    items: [
      { id: "tunnel", label: "Edge Tunnel", index: "08", tag: "Edge" },
      { id: "harness", label: "Harness + DSH", index: "09", tag: "Agent" },
      { id: "dsh-keys", label: "DSH Model Keys", index: "10", tag: "Secrets" },
    ],
  },
  {
    category: "Operations",
    items: [
      { id: "maintenance", label: "Maintenance", index: "11", tag: "Ops" },
      { id: "state", label: "State Backup", index: "12", tag: "Backup" },
      { id: "logs", label: "Workstation Logs", index: "13", tag: "Telemetry" },
    ],
  },
] as const;

export type WorkstationSectionItem =
  (typeof WORKSTATION_GROUPS)[number]["items"][number];

export type WorkstationSectionId = WorkstationSectionItem["id"];

export const WORKSTATION_SECTIONS: readonly WorkstationSectionItem[] =
  WORKSTATION_GROUPS.flatMap<WorkstationSectionItem>((group) => group.items);

const WORKSTATION_SECTION_MAP = new Map<string, WorkstationSectionItem>(
  WORKSTATION_SECTIONS.map((section) => [section.id, section])
);

export function WorkstationShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";

  const [activeSection, setActiveSection] = useState<WorkstationSectionId>(
    WORKSTATION_SECTION_MAP.has(initialTab)
      ? (initialTab as WorkstationSectionId)
      : "overview"
  );
  const [showWizard, setShowWizard] = useState<boolean>(false);

  // Check after initial render if setup is needed without blocking main content load
  useEffect(() => {
    try {
      if (localStorage.getItem("aiws.wizard.dismissed") === "true") {
        return;
      }
    } catch {
      // ignore
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const [gRes, tRes, pRes] = await Promise.allSettled([
          workstationApi.getGithubStatus(),
          workstationApi.getTunnelStatus(),
          workstationApi.getProjects(),
        ]);
        if (cancelled) {
          return;
        }
        const ghUnconfigured =
          gRes.status === "fulfilled" &&
          (gRes.value.output || "").includes("not configured");
        const tunnelUnconfigured =
          tRes.status === "fulfilled" &&
          !(tRes.value.output || "").toLowerCase().includes("active");
        const noProject =
          pRes.status === "fulfilled" &&
          !pRes.value.projects?.some((p: { active: boolean }) => p.active);

        if (ghUnconfigured || tunnelUnconfigured || noProject) {
          setShowWizard(true);
        }
      } catch {
        // ignore
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const tabQueryParam = searchParams.get("tab");
  useEffect(() => {
    if (tabQueryParam === "setup") {
      setShowWizard(true);
      return;
    }
    if (tabQueryParam && WORKSTATION_SECTION_MAP.has(tabQueryParam)) {
      setActiveSection(tabQueryParam as WorkstationSectionId);
    }
  }, [tabQueryParam]);

  const handleSelectSection = useCallback((id: WorkstationSectionId) => {
    setShowWizard(false);
    setActiveSection(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState({}, "", url.toString());
  }, []);

  const handleDismissWizard = useCallback(() => {
    setShowWizard(false);
    try {
      localStorage.setItem("aiws.wizard.dismissed", "true");
    } catch {
      // ignore
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }, [router]);

  const currentSectionMeta = WORKSTATION_SECTION_MAP.get(activeSection);

  return (
    <div className="relative w-full">
      {/* Main Layout Grid */}
      <div className="grid items-start gap-8 md:grid-cols-[220px_1fr] lg:grid-cols-[240px_1fr]">
        {/* Sticky Workstation CAD Sidebar Navigation */}
        <aside className="sticky top-20 z-30 self-start">
          {/* Mobile horizontal bar (<md) */}
          <div className="flex gap-1.5 overflow-x-auto border border-border bg-background/95 p-2 shadow-xs backdrop-blur-sm md:hidden">
            <button
              className={cn(
                "shrink-0 px-3.5 py-2 font-medium text-sm tracking-tight transition-colors",
                showWizard
                  ? "bg-foreground font-semibold text-background"
                  : "text-amber-600 dark:text-amber-400 hover:bg-muted/50"
              )}
              onClick={() => setShowWizard(true)}
              type="button"
            >
              ⚡ Setup Guide
            </button>
            {WORKSTATION_SECTIONS.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  className={cn(
                    "shrink-0 px-3.5 py-2 font-medium text-sm tracking-tight transition-colors",
                    isActive
                      ? "bg-foreground font-semibold text-background"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                  key={section.id}
                  onClick={() => handleSelectSection(section.id)}
                  type="button"
                >
                  {section.label}
                </button>
              );
            })}
          </div>

          {/* Desktop & Tablet CAD Module Directory (md+) */}
          <div className="relative hidden overflow-visible border-border border-t border-l bg-white shadow-xs md:block dark:bg-black">
            {/* CAD Corner Crosshair Ruler Ticks (anchored to outer border-box via -top-px -left-px) */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-px right-0 bottom-0 -left-px -z-10"
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

            {/* CAD Corner Intersection Dots */}
            <GridCornerDots className="z-10" columns={1} rows={1} />

            <div className="border-border border-r border-b">
              {/* Panel Header */}
              <div className="flex items-center justify-between border-border border-b bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 bg-foreground" />
                  <span className="font-bold text-foreground text-sm tracking-tight">
                    Workstation
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWizard(true)}
                  className="font-mono text-[10px] text-amber-600 dark:text-amber-400 hover:underline uppercase tracking-wider"
                >
                  ⚡ Setup Guide
                </button>
              </div>

              {/* Grouped Navigation Tree */}
              <nav className="divide-y divide-border/60">
                {WORKSTATION_GROUPS.map((group) => (
                  <div className="px-3.5 py-3.5" key={group.category}>
                    <div className="mb-2 px-2 font-mono text-[11px] text-muted-foreground/65 uppercase tracking-widest">
                      {group.category}
                    </div>
                    <div className="ml-2 flex flex-col gap-1 border-border/70 border-l pl-2.5">
                      {group.items.map((item) => {
                        const isActive = activeSection === item.id;
                        return (
                          <button
                            className={cn(
                              "group relative flex w-full items-center justify-between px-3 py-2 text-left transition-colors",
                              isActive
                                ? "bg-foreground font-semibold text-background"
                                : "font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                            key={item.id}
                            onClick={() => handleSelectSection(item.id)}
                            type="button"
                          >
                            <span className="truncate text-sm tracking-tight">
                              {item.label}
                              {isActive && (
                                <span className="ml-0.5 animate-caret-blink font-mono">
                                  _
                                </span>
                              )}
                            </span>
                            <span
                              className={cn(
                                "font-mono text-xs tabular-nums",
                                isActive
                                  ? "text-background/75"
                                  : "text-muted-foreground/50 group-hover:text-muted-foreground"
                              )}
                            >
                              {item.index}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Panel Footer Status */}
              <div className="flex items-center justify-between border-border border-t bg-muted/20 px-4 py-2.5 font-mono text-[11px] text-muted-foreground/70">
                <span className="truncate">?tab={activeSection}</span>
                <span className="text-emerald-600 uppercase dark:text-emerald-400">
                  ● Ready
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="min-w-0 flex-1">
          {/* Section banner */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-border border-b pb-3.5">
            <div className="flex items-baseline gap-2.5">
              <span className="font-mono text-muted-foreground/50 text-xs tabular-nums">
                [{currentSectionMeta?.index}]
              </span>
              <h2 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
                {currentSectionMeta?.label}
              </h2>
              <span className="hidden font-mono text-[11px] text-muted-foreground/60 uppercase tracking-widest sm:inline">
                · Module: {currentSectionMeta?.tag}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className="rounded-none border-border font-mono text-[10px] text-muted-foreground uppercase tracking-wider"
                variant="outline"
              >
                Runtime: node-01
              </Badge>
              <Badge
                className="rounded-none bg-emerald-500/10 font-mono text-[10px] text-emerald-600 uppercase tracking-wider dark:text-emerald-400"
                variant="secondary"
              >
                Online
              </Badge>
              <Button
                className="h-5 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
                size="xs"
                variant="outline"
              >
                Lock
              </Button>
            </div>
          </div>

          {/* Conditional: Setup Wizard Full View vs Regular Module View */}
          {showWizard ? (
            <WorkstationSetupFlow
              onComplete={() => {
                setShowWizard(false);
                handleDismissWizard();
              }}
            />
          ) : (
            <div className="space-y-6">
              {activeSection === "overview" && (
                <OverviewSection
                  onSelectTab={(tab) =>
                    handleSelectSection(tab as WorkstationSectionId)
                  }
                />
              )}
              {activeSection === "terminal" && <TerminalSection />}
              {activeSection === "app" && <AppSection />}
              {activeSection === "preview" && <PreviewSection />}
              {activeSection === "projects" && <ProjectsSection />}
              {activeSection === "git" && <GitSection />}
              {activeSection === "github" && <GitHubSection />}
              {activeSection === "tunnel" && <TunnelSection />}
              {activeSection === "harness" && <HarnessSection />}
              {activeSection === "dsh-keys" && <DshKeysSection />}
              {activeSection === "maintenance" && <MaintenanceSection />}
              {activeSection === "state" && <StateSection />}
              {activeSection === "logs" && <LogsSection />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
