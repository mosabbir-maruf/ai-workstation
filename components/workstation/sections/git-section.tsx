"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { GridCornerDots } from "@/components/design/line-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type GitDiffResponse, workstationApi } from "@/lib/workstation/api";
import { CadCell, CadGridFrame } from "../cad-primitives";
import { VerbatimOutput } from "../verbatim-output";

const COMMIT_PREFIX_PRESETS = [
  "feat(workstation): ",
  "fix(ui): ",
  "refactor(cad): ",
  "chore(release): ",
] as const;

const CONVENTIONAL_COMMIT_PREFIX_REGEX = /^[a-z]+(\([^)]+\))?:\s*/i;

function getFileStatusBadgeClass(status: string): string {
  if (status.includes("A") || status === "??") {
    return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
  }
  if (status.includes("D")) {
    return "text-rose-500 border-rose-500/30 bg-rose-500/10";
  }
  if (status.includes("M")) {
    return "text-amber-500 border-amber-500/30 bg-amber-500/10";
  }
  return "text-primary border-primary/30 bg-primary/10";
}

function getDiffLineClass(line: string): string {
  if (line.startsWith("+") && !line.startsWith("+++")) {
    return "text-emerald-400 bg-emerald-500/10";
  }
  if (line.startsWith("-") && !line.startsWith("---")) {
    return "text-rose-400 bg-rose-500/10";
  }
  if (line.startsWith("@@")) {
    return "text-cyan-400 bg-cyan-500/10 font-bold";
  }
  if (line.startsWith("diff --git")) {
    return "text-foreground font-semibold bg-muted/40 border-t border-border/40 mt-2 first:mt-0";
  }
  return "text-muted-foreground";
}

export function GitSection() {
  const [commitMessage, setCommitMessage] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [diffData, setDiffData] = useState<GitDiffResponse | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);

  const fetchDiff = useCallback(async () => {
    try {
      setDiffLoading(true);
      setDiffError(null);
      const res = await workstationApi.gitDiff();
      setDiffData(res);
    } catch (err) {
      setDiffError(String(err));
    } finally {
      setDiffLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiff();
  }, [fetchDiff]);

  const diffLines = useMemo(() => {
    if (!diffData?.diff) {
      return [];
    }
    return diffData.diff.split("\n");
  }, [diffData?.diff]);

  const handlePull = async () => {
    try {
      setLoading(true);
      const res = await workstationApi.gitPull();
      setOutput(res.output);
      await fetchDiff();
    } catch (err) {
      setOutput(`Git pull error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) {
      return;
    }

    try {
      setLoading(true);
      const res = await workstationApi.gitPush(commitMessage.trim());
      setOutput(res.output);
      setCommitMessage("");
      await fetchDiff();
    } catch (err) {
      setOutput(`Git push error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPrefix = (prefix: string) => {
    if (!commitMessage.trim()) {
      setCommitMessage(prefix);
      return;
    }
    const stripped = commitMessage.replace(
      CONVENTIONAL_COMMIT_PREFIX_REGEX,
      ""
    );
    setCommitMessage(`${prefix}${stripped}`);
  };

  return (
    <div className="space-y-10 md:space-y-11">
      {/* Row 1: [G-01] Git Synchronize (Pull) + [G-02] Git Commit & Push */}
      <CadGridFrame showRulers>
        <div className="relative w-full overflow-visible">
          <div className="grid w-full grid-cols-1 md:grid-cols-12">
            {/* Left 6 cols: [G-01] Git Synchronize (Pull) */}
            <CadCell
              bodyClassName="space-y-5"
              className="md:col-span-6"
              footerLeft="POST /api/git/pull · Fetch & Fast-Forward"
              footerRight="Remote · origin/main"
              headerAction={
                <Button
                  className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                  disabled={loading}
                  onClick={handlePull}
                  size="xs"
                  variant="outline"
                >
                  Pull Now ↓
                </Button>
              }
              index="G-01"
              title="Git Synchronize (Pull)"
            >
              <div>
                <div className="mb-2.5 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  Upstream Sync Specification
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm">
                        origin
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                      Upstream Remote
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm">
                        ⎇ main
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                      Tracked Branch
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm">
                        FF-Only
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                      Merge Strategy
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-border/50 border-t pt-4">
                <div className="flex flex-wrap items-center justify-between gap-1 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  <span>Execution Command Pipeline</span>
                  <span>Clean Index Verified</span>
                </div>

                <div className="border border-border/70 bg-muted/15 px-3.5 py-2 font-mono text-foreground text-xs break-all overflow-x-auto">
                  git fetch --prune origin && git pull --ff-only origin main
                </div>

                <Button
                  className="h-9 w-full rounded-none font-mono text-xs uppercase tracking-wider"
                  disabled={loading}
                  onClick={handlePull}
                  variant="default"
                >
                  {loading
                    ? "Synchronizing Working Tree..."
                    : "Execute Git Pull ↓"}
                </Button>
              </div>
            </CadCell>

            {/* Right 6 cols: [G-02] Git Commit & Push */}
            <CadCell
              bodyClassName="space-y-5"
              className="md:col-span-6"
              footerLeft="POST /api/git/push · Stage, Commit & Push"
              footerRight="Conventional Commits"
              index="G-02"
              title="Git Commit & Push"
            >
              <div>
                <div className="mb-2.5 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  Staging & Commit Pipeline
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm">
                        git add -A
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                      Stage Policy
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm">
                        SSH / GPG
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                      Commit Auth
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-3 sm:py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm">
                        Biome Check
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px] sm:text-xs">
                      Pre-Commit Hook
                    </span>
                  </div>
                </div>
              </div>

              <form
                className="space-y-3 border-border/50 border-t pt-4"
                onSubmit={handlePush}
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <label
                    className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest"
                    htmlFor="git-commit-msg"
                  >
                    Commit Message
                  </label>
                  <div className="flex flex-wrap items-center gap-1">
                    {COMMIT_PREFIX_PRESETS.map((prefix) => (
                      <button
                        className="border border-border/70 bg-muted/15 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/30 hover:text-foreground"
                        key={prefix}
                        onClick={() => handleApplyPrefix(prefix)}
                        type="button"
                      >
                        {prefix.trim()}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  className="h-9 rounded-none border-border/80 bg-muted/15 font-mono text-base sm:text-xs"
                  disabled={loading}
                  id="git-commit-msg"
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="feat(workstation): update environment definitions..."
                  value={commitMessage}
                />

                <Button
                  className="h-9 w-full rounded-none font-mono text-xs uppercase tracking-wider"
                  disabled={loading || !commitMessage.trim()}
                  type="submit"
                >
                  Stage, Commit & Push ↑
                </Button>
              </form>
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

      {/* Row 2: [G-03] Working Tree Diff & Changed Files */}
      <CadGridFrame showRulers>
        <div className="relative w-full overflow-visible">
          <CadCell
            footerLeft="GET /api/git/diff · git status & diff HEAD"
            footerRight={
              <span className="truncate max-w-[200px] sm:max-w-none">
                {diffData?.project ? (
                  <>
                    Active Project ·{" "}
                    <span className="font-bold text-foreground">
                      {diffData.project}
                    </span>
                  </>
                ) : (
                  "Active Project"
                )}
              </span>
            }
            headerAction={
              <div className="flex items-center gap-1.5">
                {diffLoading ? (
                  <Badge
                    className="font-mono text-[10px] uppercase"
                    size="sm"
                    variant="outline"
                  >
                    Checking...
                  </Badge>
                ) : diffData?.clean ? (
                  <Badge
                    className="border-emerald-500/40 bg-emerald-500/10 text-emerald-500 font-mono text-[10px] uppercase"
                    size="sm"
                    variant="outline"
                  >
                    Clean · 0 Changes
                  </Badge>
                ) : (diffData?.filesCount ?? 0) > 0 ? (
                  <Badge
                    className="border-amber-500/40 bg-amber-500/10 text-amber-500 font-mono text-[10px] uppercase"
                    size="sm"
                    variant="outline"
                  >
                    {diffData?.filesCount}{" "}
                    {diffData?.filesCount === 1 ? "File" : "Files"} Changed
                  </Badge>
                ) : null}

                <Button
                  className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                  disabled={diffLoading}
                  onClick={fetchDiff}
                  size="xs"
                  variant="outline"
                >
                  {diffLoading ? "Diffing..." : "Refresh Diff ↻"}
                </Button>
              </div>
            }
            index="G-03"
            title="Working Tree Diff & Changed Files"
          >
            <div className="space-y-4">
              {/* Diff summary meta bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border border-border/70 bg-muted/15 px-3 py-2 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      diffData?.clean ? "bg-emerald-500" : "bg-amber-500"
                    )}
                  />
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-semibold text-foreground">
                    {diffData?.clean
                      ? "Working Tree Clean"
                      : "Uncommitted Changes Detected"}
                  </span>
                </div>
                {diffData?.stat ? (
                  <span className="max-w-full truncate text-[11px] text-muted-foreground/90">
                    {diffData.stat}
                  </span>
                ) : null}
              </div>

              {/* Changed files pill list */}
              {diffData?.files && diffData.files.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                    <span>Changed Files ({diffData.files.length})</span>
                    <span>Status Code</span>
                  </div>
                  <div className="flex max-h-[140px] flex-wrap gap-1.5 overflow-y-auto border border-border/70 bg-muted/10 p-2">
                    {diffData.files.map((file, idx) => (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[11px]",
                          getFileStatusBadgeClass(file.status)
                        )}
                        key={`${file.path}-${idx}`}
                      >
                        <span className="font-bold">{file.status}</span>
                        <span className="text-foreground">{file.path}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Diff Code Display or Clean State */}
              {diffLoading && !diffData ? (
                <div className="flex min-h-[140px] items-center justify-center border border-border/70 border-dashed bg-muted/10 p-4 text-center font-mono text-muted-foreground/60 text-xs">
                  Computing working tree diff...
                </div>
              ) : diffError ? (
                <div className="border border-destructive/50 bg-destructive/10 p-3 font-mono text-destructive text-xs">
                  {diffError}
                </div>
              ) : diffData?.clean &&
                (!diffData?.diff || diffData.diff.trim().length === 0) ? (
                <div className="flex min-h-[140px] flex-col items-center justify-center border border-border/70 border-dashed bg-muted/10 p-6 text-center">
                  <span className="mb-2.5 size-2 rounded-full bg-emerald-500" />
                  <p className="font-mono font-semibold text-foreground text-xs">
                    Working tree clean
                  </p>
                  <p className="mt-1 max-w-md font-mono text-[11px] text-muted-foreground/70">
                    No unstaged modifications, staged changes, or untracked
                    files in the active project.
                  </p>
                </div>
              ) : diffLines.length > 0 ? (
                <div className="relative flex flex-col border border-border/70 bg-muted/15 text-card-foreground shadow-none">
                  <div className="flex items-center justify-between border-border/60 border-b bg-muted/20 px-3 py-1.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="size-1.5 shrink-0 rounded-full bg-amber-500" />
                      <span className="truncate font-mono text-[11px] text-muted-foreground">
                        git diff HEAD
                      </span>
                    </div>
                    <CopyButton
                      aria-label="Copy diff"
                      className="size-6 shrink-0 rounded-none border border-border/60"
                      text={diffData?.diff || ""}
                    />
                  </div>

                  <div className="max-h-[360px] min-h-[120px] select-text overflow-x-auto overflow-y-auto p-2 font-mono text-xs leading-relaxed">
                    {diffLines.map((line, idx) => (
                      <div
                        className={cn(
                          "whitespace-pre px-2 py-0.5 font-mono text-[11px]",
                          getDiffLineClass(line)
                        )}
                        key={idx}
                      >
                        {line || " "}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[100px] flex-col items-center justify-center border border-border/70 border-dashed bg-muted/10 p-4 text-center font-mono text-muted-foreground/60 text-xs">
                  {diffData?.output || "No changes to display."}
                </div>
              )}
            </div>
          </CadCell>

          <GridCornerDots
            className="z-3 hidden md:block"
            columns={1}
            rows={1}
          />
        </div>
      </CadGridFrame>

      {/* Row 3: [G-04] Git Subprocess Terminal Output */}
      <CadGridFrame showRulers>
        <div className="relative w-full overflow-visible">
          <CadCell
            footerLeft="Subprocess · git stdout & stderr stream"
            footerRight={
              <span className="max-w-[180px] truncate sm:max-w-none">
                <span className="sm:hidden">Dir: ai-workstation</span>
                <span className="hidden sm:inline">
                  Working Directory · /workspace/projects/ai-workstation
                </span>
              </span>
            }
            headerAction={
              output ? (
                <Button
                  className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                  onClick={() => setOutput(null)}
                  size="xs"
                  variant="ghost"
                >
                  Clear
                </Button>
              ) : undefined
            }
            index="G-04"
            title="Git Subprocess Terminal Output"
          >
            <VerbatimOutput label="Git Execution Output" output={output} />
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
