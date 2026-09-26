"use client";

import { useState } from "react";
import { GridCornerDots } from "@/components/design/line-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { workstationApi } from "@/lib/workstation/api";
import { CadCell, CadGridFrame } from "../cad-primitives";
import { VerbatimOutput } from "../verbatim-output";

const COMMIT_PREFIX_PRESETS = [
  "feat(workstation): ",
  "fix(ui): ",
  "refactor(cad): ",
  "chore(release): ",
] as const;

const CONVENTIONAL_COMMIT_PREFIX_REGEX = /^[a-z]+(\([^)]+\))?:\s*/i;

export function GitSection() {
  const [commitMessage, setCommitMessage] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePull = async () => {
    try {
      setLoading(true);
      const res = await workstationApi.gitPull();
      setOutput(res.output);
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
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-sm">
                        origin
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                      Upstream Remote
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-sm">
                        ⎇ main
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                      Tracked Branch
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-sm">
                        FF-Only
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                      Merge Strategy
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-border/50 border-t pt-4">
                <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  <span>Execution Command Pipeline</span>
                  <span>Clean Index Verified</span>
                </div>

                <div className="border border-border/70 bg-muted/15 px-3.5 py-2 font-mono text-foreground text-xs">
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
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-sm">
                        git add -A
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                      Stage Policy
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-sm">
                        SSH / GPG
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                      Commit Auth
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-sm">
                        Biome Check
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
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
                  className="h-9 rounded-none border-border/80 bg-muted/15 font-mono text-xs"
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

      {/* Row 2: [G-03] Git Subprocess Terminal Output */}
      <CadGridFrame showRulers>
        <div className="relative w-full overflow-visible">
          <CadCell
            footerLeft="Subprocess · git stdout & stderr stream"
            footerRight="Working Directory · /workspace/projects/ai-workstation"
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
            index="G-03"
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
