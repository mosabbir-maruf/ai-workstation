"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { GridCornerDots } from "@/components/design/line-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@aiws/icons";
import { cn } from "@/lib/utils";
import { OverviewSection } from "./sections/overview-section";
import { WorkstationSpinner } from "./cad-primitives";
import { workstationApi } from "@/lib/workstation/api";

const AppSection = lazy(() =>
  import("./sections/app-section").then((m) => ({ default: m.AppSection }))
);
const DshKeysSection = lazy(() =>
  import("./sections/dsh-keys-section").then((m) => ({
    default: m.DshKeysSection,
  }))
);
const GitSection = lazy(() =>
  import("./sections/git-section").then((m) => ({ default: m.GitSection }))
);
const GitHubSection = lazy(() =>
  import("./sections/github-section").then((m) => ({
    default: m.GitHubSection,
  }))
);
const HarnessSection = lazy(() =>
  import("./sections/harness-section").then((m) => ({
    default: m.HarnessSection,
  }))
);
const LogsSection = lazy(() =>
  import("./sections/logs-section").then((m) => ({ default: m.LogsSection }))
);
const MaintenanceSection = lazy(() =>
  import("./sections/maintenance-section").then((m) => ({
    default: m.MaintenanceSection,
  }))
);
const PreviewSection = lazy(() =>
  import("./sections/preview-section").then((m) => ({
    default: m.PreviewSection,
  }))
);
const ProjectsSection = lazy(() =>
  import("./sections/projects-section").then((m) => ({
    default: m.ProjectsSection,
  }))
);
const StateSection = lazy(() =>
  import("./sections/state-section").then((m) => ({ default: m.StateSection }))
);
const TerminalSection = lazy(() =>
  import("./sections/terminal-section").then((m) => ({
    default: m.TerminalSection,
  }))
);
const TunnelSection = lazy(() =>
  import("./sections/tunnel-section").then((m) => ({
    default: m.TunnelSection,
  }))
);
const WorkstationSetupFlow = lazy(() =>
  import("./workstation-setup-flow").then((m) => ({
    default: m.WorkstationSetupFlow,
  }))
);

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

const WIZARD_COMPLETED_KEY = "aiws.wizard.completed";
const WIZARD_DISMISSED_KEY = "aiws.wizard.dismissed";

function readStorageFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeStorageFlag(key: string, value: boolean): void {
  try {
    if (value) {
      localStorage.setItem(key, "true");
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

function SetupGuideLabel({
  isSetupComplete,
  isMobile,
  showWizard,
}: {
  isSetupComplete: boolean;
  isMobile?: boolean;
  showWizard?: boolean;
}) {
  if (isSetupComplete) {
    return (
      <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
        <Icon
          className={cn(
            isMobile ? "size-3.5 -mr-0.5" : "size-3 -mr-0.5",
            showWizard
              ? "text-background"
              : "text-emerald-600 dark:text-emerald-400",
            "shrink-0"
          )}
          name="IconCheckmark1"
          size={isMobile ? 14 : 12}
        />
        <span>Completed Setup</span>
      </span>
    );
  }
  return <span className="whitespace-nowrap">⚡ Setup Guide</span>;
}

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
  // Initialize as false to guarantee SSR hydration parity, then sync from localStorage on client mount
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nav = mobileNavRef.current;
    if (typeof window !== "undefined" && window.innerWidth < 768 && nav) {
      const activeEl = nav.querySelector<HTMLElement>('[data-active="true"]');
      if (activeEl) {
        const scrollLeft =
          activeEl.offsetLeft - nav.clientWidth / 2 + activeEl.offsetWidth / 2;
        nav.scrollTo({ left: Math.max(0, scrollLeft), behavior: "smooth" });
      }
    }
  }, [activeSection, showWizard]);

  // Sync setup status from localStorage and only probe backend if not already marked complete
  useEffect(() => {
    if (readStorageFlag(WIZARD_COMPLETED_KEY)) {
      setIsSetupComplete(true);
      return;
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

        const isComplete = !ghUnconfigured && !tunnelUnconfigured && !noProject;
        if (isComplete) {
          setIsSetupComplete(true);
          writeStorageFlag(WIZARD_COMPLETED_KEY, true);
        }

        const isDismissed = readStorageFlag(WIZARD_DISMISSED_KEY);
        if (!isDismissed && !isComplete) {
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

  const scrollToConsole = useCallback(() => {
    document
      .getElementById("workstation-console")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const tabQueryParam = searchParams.get("tab");
  useEffect(() => {
    if (!tabQueryParam) {
      return;
    }
    if (tabQueryParam === "setup") {
      setShowWizard(true);
    } else if (WORKSTATION_SECTION_MAP.has(tabQueryParam)) {
      setActiveSection(tabQueryParam as WorkstationSectionId);
    }
    const raf = requestAnimationFrame(scrollToConsole);
    return () => cancelAnimationFrame(raf);
  }, [tabQueryParam, scrollToConsole]);

  const handleSelectSection = useCallback(
    (id: WorkstationSectionId) => {
      setShowWizard(false);
      setActiveSection(id);
      scrollToConsole();
      const url = new URL(window.location.href);
      url.searchParams.set("tab", id);
      window.history.replaceState({}, "", url.toString());
    },
    [scrollToConsole]
  );

  const handleOpenWizard = useCallback(() => {
    setShowWizard(true);
    scrollToConsole();
  }, [scrollToConsole]);


  const handleCompleteWizard = useCallback(() => {
    setShowWizard(false);
    setIsSetupComplete(true);
    writeStorageFlag(WIZARD_COMPLETED_KEY, true);
    writeStorageFlag(WIZARD_DISMISSED_KEY, true);
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
    <div className="relative w-full min-w-0 max-w-full">
      {/* Main Layout Grid */}
      <div className="grid w-full min-w-0 max-w-full items-start gap-4 md:gap-8 md:grid-cols-[230px_1fr] lg:grid-cols-[240px_1fr]">
        {/* Sticky Workstation CAD Sidebar Navigation */}
        <aside className="sticky top-20 z-30 self-start w-full min-w-0 max-w-full">
          {/* Mobile horizontal bar (<md) */}
          <div
            ref={mobileNavRef}
            className="flex w-full min-w-0 max-w-full gap-1.5 overflow-x-auto no-scrollbar border border-border bg-background/95 p-1.5 sm:p-2 shadow-xs backdrop-blur-sm md:hidden overscroll-x-contain"
          >
            <button
              data-active={showWizard ? "true" : "false"}
              className={cn(
                "flex shrink-0 items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 font-medium text-xs sm:text-sm tracking-tight transition-colors",
                showWizard
                  ? "bg-foreground font-semibold text-background"
                  : isSetupComplete
                    ? "text-emerald-600 dark:text-emerald-400 hover:bg-muted/50"
                    : "text-amber-600 dark:text-amber-400 hover:bg-muted/50"
              )}
              onClick={handleOpenWizard}
              suppressHydrationWarning
              type="button"
            >
              <SetupGuideLabel
                isMobile
                isSetupComplete={isSetupComplete}
                showWizard={showWizard}
              />
            </button>
            {WORKSTATION_SECTIONS.map((section) => {
              const isActive = !showWizard && activeSection === section.id;
              return (
                <button
                  data-active={isActive ? "true" : "false"}
                  className={cn(
                    "shrink-0 px-3 py-1.5 sm:px-3.5 sm:py-2 font-medium text-xs sm:text-sm tracking-tight transition-colors",
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
              <div className="flex items-center justify-between gap-2 border-border border-b bg-muted/30 px-3.5 py-3">
                <div className="flex shrink-0 items-center gap-2">
                  <span className="size-2 bg-foreground" />
                  <span className="font-bold text-foreground text-sm tracking-tight">
                    Workstation
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenWizard}
                  suppressHydrationWarning
                  className={cn(
                    "flex shrink-0 items-center gap-1 font-mono text-[10px] whitespace-nowrap uppercase tracking-tight transition-colors hover:underline",
                    isSetupComplete
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400 tracking-wider"
                  )}
                >
                  <SetupGuideLabel isSetupComplete={isSetupComplete} />
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
        <main className="w-full min-w-0 max-w-full flex-1">
          {/* Section banner */}
          <div className="mb-4 sm:mb-6 flex w-full min-w-0 flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-border border-b pb-3 sm:pb-3.5">
            <div className="flex items-baseline gap-2 sm:gap-2.5 min-w-0">
              <span className="font-mono text-muted-foreground/50 text-xs tabular-nums">
                [{currentSectionMeta?.index}]
              </span>
              <h2 className="truncate font-bold text-foreground text-xl tracking-tight sm:text-2xl">
                {currentSectionMeta?.label}
              </h2>
              <span className="hidden font-mono text-[11px] text-muted-foreground/60 uppercase tracking-widest sm:inline">
                · Module: {currentSectionMeta?.tag}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Badge
                className="hidden xs:inline-flex rounded-none border-border font-mono text-[10px] text-muted-foreground uppercase tracking-wider"
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
          <Suspense
            fallback={
              <WorkstationSpinner
                className="min-h-[320px] border border-border bg-white dark:bg-black"
                label="Loading Ai Workstation Module..."
              />
            }
          >
            {showWizard ? (
              <WorkstationSetupFlow onComplete={handleCompleteWizard} />
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
          </Suspense>
        </main>
      </div>
    </div>
  );
}
