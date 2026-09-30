"use client";

import { useCallback, useEffect, useState } from "react";
import { GridCornerDots } from "@/components/design/line-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { workstationApi } from "@/lib/workstation/api";
import { CadCell, CadGridFrame } from "../cad-primitives";
import { VerbatimOutput } from "../verbatim-output";

const QUICK_REPO_PRESETS = [
  {
    label: "+ ai-workstation",
    url: "https://github.com/mosabbir-maruf/ai-workstation.git",
  },
  {
    label: "+ ai-workstation-cli",
    url: "https://github.com/mosabbir-maruf/ai-workstation.git",
  },
] as const;

export function ProjectsSection() {
  const [projects, setProjects] = useState<
    Array<{ name: string; active: boolean }>
  >([]);
  const [rawOutput, setRawOutput] = useState<string | null>(null);
  const [actionOutput, setActionOutput] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<"mount" | "manage" | null>(null);
  const [actionOk, setActionOk] = useState<boolean | null>(null);
  const [newRepoUrl, setNewRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await workstationApi.getProjects();
      if (res.ok && res.projects) {
        setProjects(res.projects);
        setRawOutput(res.raw || null);
      } else {
        setProjects([]);
        setRawOutput(res.raw || res.output || "No active projects returned from backend.");
      }
    } catch (err) {
      setActionOutput(`Failed to fetch projects: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleUse = async (name: string) => {
    try {
      setLoading(true);
      setLastAction("manage");
      const res = await workstationApi.activateProject(name);
      setActionOutput(res.output);
      setActionOk(res.ok);
      await fetchProjects();
    } catch (err) {
      setActionOutput(`Error activating project: ${String(err)}`);
      setActionOk(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoUrl.trim()) {
      return;
    }

    try {
      setLoading(true);
      setLastAction("mount");
      const res = await workstationApi.addProject(newRepoUrl.trim());
      setActionOutput(res.output);
      setActionOk(res.ok);
      setNewRepoUrl("");
      await fetchProjects();
    } catch (err) {
      setActionOutput(`Error adding project: ${String(err)}`);
      setActionOk(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (name: string) => {
    try {
      setLoading(true);
      setLastAction("manage");
      const res = await workstationApi.removeProject(name);
      setActionOutput(res.output);
      setActionOk(res.ok);
      await fetchProjects();
    } catch (err) {
      setActionOutput(`Error removing project: ${String(err)}`);
      setActionOk(false);
    } finally {
      setLoading(false);
    }
  };

  const activeProject =
    projects.find((p) => p.active)?.name || "None";

  return (
    <div className="space-y-10 md:space-y-11">
      {/* Row 1: [P-01] Mount Workspace Repository + [P-02] Configured Workstation Projects */}
      <CadGridFrame showRulers>
        <div className="relative w-full overflow-visible">
          <div className="grid w-full grid-cols-1 md:grid-cols-12">
            {/* Left 6 cols: [P-01] Mount Workspace Repository */}
            <CadCell
              bodyClassName="space-y-5"
              className="md:col-span-6"
              footerLeft="POST /api/projects/add · Clone & Mount"
              footerRight="Git SSH / HTTPS"
              index="P-01"
              title="Mount Workspace Repository"
            >
              <div>
                <div className="mb-2.5 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  Mount Target Specification
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm">
                        /workspace
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                      Mount Root
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm">
                        SSH / TLS
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                      Git Transport
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm tabular-nums">
                        {projects.length} Mounted
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                      Registry Count
                    </span>
                  </div>
                </div>
              </div>

              <form
                className="space-y-3 border-border/50 border-t pt-4"
                onSubmit={handleAdd}
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <label
                    className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest"
                    htmlFor="repo-url-input"
                  >
                    Repository Remote URI
                  </label>
                  <div className="flex flex-wrap items-center gap-1">
                    {QUICK_REPO_PRESETS.map((preset) => (
                      <button
                        className="border border-border/70 bg-muted/15 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/30 hover:text-foreground"
                        key={preset.label}
                        onClick={() => setNewRepoUrl(preset.url)}
                        type="button"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Input
                    className="h-9 flex-1 rounded-none border-border/80 bg-muted/15 font-mono text-base sm:text-xs"
                    disabled={loading}
                    id="repo-url-input"
                    onChange={(e) => setNewRepoUrl(e.target.value)}
                    placeholder="https://github.com/org/repo.git or git@github.com:..."
                    value={newRepoUrl}
                  />
                  <Button
                    className="h-9 shrink-0 rounded-none px-4 font-mono text-xs uppercase tracking-wider w-full sm:w-auto"
                    disabled={loading || !newRepoUrl.trim()}
                    type="submit"
                  >
                    Add & Mount →
                  </Button>
                </div>

                {lastAction === "mount" && actionOutput && (
                  <div className="border-border/50 border-t pt-3">
                    <VerbatimOutput
                      label="POST /api/projects/add"
                      ok={actionOk ?? true}
                      onClear={() => {
                        setActionOutput(null);
                        setLastAction(null);
                        setActionOk(null);
                      }}
                      output={actionOutput}
                      preClassName="min-h-[60px] max-h-[160px] p-2.5 text-[11px]"
                    />
                  </div>
                )}
              </form>
            </CadCell>

            {/* Right 6 cols: [P-02] Configured Workstation Projects */}
            <CadCell
              bodyClassName="space-y-2.5"
              className="md:col-span-6"
              footerLeft={`Total Registered · ${projects.length} Repositories`}
              footerRight={`Active Target · ${activeProject}`}
              headerAction={
                <Button
                  className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                  disabled={loading}
                  onClick={fetchProjects}
                  size="xs"
                  variant="outline"
                >
                  Sync List ↻
                </Button>
              }
              index="P-02"
              title="Configured Workstation Projects"
            >
              <div className="mb-1 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                Mounted Workspace Directories
              </div>

              <div className="space-y-2">
                {projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center border border-dashed border-border/80 p-6 text-center">
                    <p className="font-mono text-muted-foreground text-xs">
                      {loading
                        ? "Loading project registry from backend..."
                        : "No projects registered yet. Use the form on the left or 'ai add <repo>' to mount a workspace."}
                    </p>
                  </div>
                ) : (
                  projects.map((proj) => (
                    <div
                      className="flex items-center justify-between gap-2.5 border border-border/70 bg-muted/15 px-3 py-2 transition-colors hover:bg-muted/25"
                      key={proj.name}
                    >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            proj.active
                              ? "size-1.5 shrink-0 rounded-full bg-emerald-500"
                              : "size-1.5 shrink-0 rounded-full bg-muted-foreground/40"
                          }
                        />
                        <span
                          className="truncate font-bold text-foreground text-xs sm:text-sm tracking-tight"
                          title={proj.name}
                        >
                          {proj.name}
                        </span>
                        {proj.active ? (
                          <Badge
                            className="rounded-none border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 font-mono text-[9px] sm:text-[10px] text-emerald-600 uppercase tracking-wider dark:text-emerald-400 shrink-0"
                            variant="outline"
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            className="rounded-none px-1.5 py-0 font-mono text-[9px] sm:text-[10px] text-muted-foreground uppercase shrink-0"
                            variant="outline"
                          >
                            Standby
                          </Badge>
                        )}
                      </div>
                      <div
                        className="mt-0.5 truncate font-mono text-[10px] sm:text-[11px] text-muted-foreground"
                        title={`/workspace/projects/${proj.name}`}
                      >
                        /workspace/projects/{proj.name}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {!proj.active && (
                        <Button
                          className="h-7 rounded-none px-2 sm:px-2.5 font-mono text-[10px] uppercase tracking-wider"
                          disabled={loading}
                          onClick={() => handleUse(proj.name)}
                          size="xs"
                          variant="default"
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        className="h-7 rounded-none px-2 sm:px-2.5 font-mono text-[10px] uppercase tracking-wider"
                        disabled={loading}
                        onClick={() => handleRemove(proj.name)}
                        size="xs"
                        variant="outline"
                      >
                        Detach
                      </Button>
                    </div>
                  </div>
                )))}
              </div>
              {lastAction === "manage" && actionOutput && (
                <div className="border-border/50 border-t pt-3">
                  <VerbatimOutput
                    label="POST /api/projects/*"
                    ok={actionOk ?? true}
                    onClear={() => {
                      setActionOutput(null);
                      setLastAction(null);
                      setActionOk(null);
                    }}
                    output={actionOutput}
                    preClassName="min-h-[60px] max-h-[160px] p-2.5 text-[11px]"
                  />
                </div>
              )}
            </CadCell>
          </div>

          <GridCornerDots
            className="z-3 hidden md:block"
            columns={2}
            columnWeights={[6, 6]}
            rows={1}
          />
        </div>
      </CadGridFrame>

      {/* Row 2: [P-03] Workspace Registry Manifest */}
      <CadGridFrame showRulers>
        <div className="relative w-full overflow-visible">
          <CadCell
            footerLeft="GET /api/projects [raw]"
            footerRight="Workspace Registry"
            headerAction={
              <Button
                className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                disabled={loading}
                onClick={fetchProjects}
                size="xs"
                variant="ghost"
              >
                Refresh ↻
              </Button>
            }
            index="P-03"
            title="Workspace Registry Manifest"
          >
            <VerbatimOutput
              label="GET /api/projects [raw]"
              output={rawOutput}
            />
          </CadCell>

          <GridCornerDots
            className="z-3 hidden md:block"
            columns={1}
            rows={1}
          />
        </div>
      </CadGridFrame>
    </div>
  );
}
