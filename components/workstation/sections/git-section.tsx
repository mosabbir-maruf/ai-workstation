"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { GridCornerDots } from "@/components/design/line-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  type GitConfigResponse,
  type GitDiffResponse,
  workstationApi,
} from "@/lib/workstation/api";
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

const MAX_DIFF_LINES = 300;

const GIT_QUICK_ACTIONS = [
  { label: "status", command: "status", description: "Show working tree status" },
  { label: "log -5", command: "log -n 5 --oneline", description: "Recent 5 commits" },
  { label: "branch -a", command: "branch -a", description: "List all local & remote branches" },
  { label: "remote -v", command: "remote -v", description: "Show remote repositories" },
  { label: "stash list", command: "stash list", description: "List stashed changes" },
  { label: "diff --stat", command: "diff --stat", description: "Summary of changes" },
  { label: "fetch --prune", command: "fetch --prune origin", description: "Fetch latest remote refs" },
] as const;

export function GitSection() {
  const [commitMessage, setCommitMessage] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [diffData, setDiffData] = useState<GitDiffResponse | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [manualCommand, setManualCommand] = useState("");
  const [executingGit, setExecutingGit] = useState(false);
  const [lastExecutedCmd, setLastExecutedCmd] = useState<string | null>(null);
  const [lastCmdStatus, setLastCmdStatus] = useState<boolean | null>(null);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Git Committer Identity Configuration state
  const [gitConfig, setGitConfig] = useState<GitConfigResponse | null>(null);
  const [configSaving, setConfigSaving] = useState(false);
  const [showIdentityEditor, setShowIdentityEditor] = useState(false);
  const [authorNameInput, setAuthorNameInput] = useState("");
  const [authorEmailInput, setAuthorEmailInput] = useState("");
  const [identityFeedback, setIdentityFeedback] = useState<string | null>(null);

  const isGitBusy = loading || executingGit;

  const isDaemonRestartRequired = Boolean(
    diffData?.needsDaemonRestart ||
      diffData?.output?.includes("Endpoint not found")
  );
  const isDiffError = Boolean(
    !isDaemonRestartRequired && (diffError || diffData?.ok === false)
  );

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

  const fetchGitConfig = useCallback(async () => {
    try {
      const res = await workstationApi.gitGetConfig();
      setGitConfig(res);
      if (res.name) {
        setAuthorNameInput(res.name);
      }
      if (res.isConfigured && res.email) {
        setAuthorEmailInput(res.email);
      }
    } catch {
      // Ignore background fetch error
    }
  }, []);

  useEffect(() => {
    fetchDiff();
    fetchGitConfig();
  }, [fetchDiff, fetchGitConfig]);

  const diffLines = useMemo(() => {
    if (!diffData?.diff) {
      return [];
    }
    return diffData.diff.split("\n");
  }, [diffData?.diff]);

  const visibleDiffLines = useMemo(
    () => diffLines.slice(0, MAX_DIFF_LINES),
    [diffLines]
  );

  const handlePull = async () => {
    try {
      setLoading(true);
      setLastExecutedCmd("git pull --ff-only");
      const res = await workstationApi.gitPull();
      setOutput(res.output);
      setLastCmdStatus(res.ok);
      await fetchDiff();
    } catch (err) {
      setOutput(`Git pull error: ${String(err)}`);
      setLastCmdStatus(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIdentity = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    const name = authorNameInput.trim();
    const email = authorEmailInput.trim();

    if (!name) {
      setIdentityFeedback("Please enter your author name or username.");
      return;
    }
    if (!email || !email.includes("@") || email.includes(" ")) {
      setIdentityFeedback("Please enter a valid GitHub account email address.");
      return;
    }

    try {
      setConfigSaving(true);
      setIdentityFeedback(null);
      const res = await workstationApi.gitSetConfig({ name, email });
      setGitConfig(res);
      setShowIdentityEditor(false);
      setOutput(
        `Git committer identity updated successfully:\n  user.name: ${res.name}\n  user.email: ${res.email}`
      );
      setLastCmdStatus(true);
    } catch (err) {
      setIdentityFeedback(`Failed to save Git identity: ${String(err)}`);
    } finally {
      setConfigSaving(false);
    }
  };

  const handlePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) {
      return;
    }

    if (!gitConfig?.isConfigured) {
      setShowIdentityEditor(true);
      setIdentityFeedback(
        "Please configure your Git author name & GitHub email before committing so your profile picture and author link appear correctly on GitHub."
      );
      return;
    }

    try {
      setLoading(true);
      setLastExecutedCmd(`git push -m "${commitMessage.trim()}"`);
      const res = await workstationApi.gitPush(commitMessage.trim());
      setOutput(res.output);
      setLastCmdStatus(res.ok);
      setCommitMessage("");
      await fetchDiff();
    } catch (err) {
      setOutput(`Git push error: ${String(err)}`);
      setLastCmdStatus(false);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteGit = async (cmdToRun?: string) => {
    const raw = (cmdToRun ?? manualCommand).trim();
    if (!raw || executingGit) return;

    try {
      setExecutingGit(true);
      const displayCmd = raw.startsWith("git ") ? raw : `git ${raw}`;
      setLastExecutedCmd(displayCmd);
      const res = await workstationApi.gitExec(raw);
      setOutput(res.output);
      setLastCmdStatus(res.ok);
      if (!cmdToRun) {
        setCmdHistory((prev) => [raw, ...prev.filter((c) => c !== raw)]);
        setManualCommand("");
        setHistoryIndex(-1);
      }
      await fetchDiff();
    } catch (err) {
      setOutput(`Git execution error: ${String(err)}`);
      setLastCmdStatus(false);
    } finally {
      setExecutingGit(false);
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
            {/* Left 6 cols: [G-01] Git Synchronize & CLI Execution */}
            <CadCell
              bodyClassName="space-y-4"
              className="md:col-span-6"
              footerLeft="POST /api/git/pull · Synchronize & CLI Execution"
              footerRight="Remote · origin/main"
              headerAction={
                <Button
                  className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                  disabled={isGitBusy}
                  onClick={handlePull}
                  size="xs"
                  variant="outline"
                >
                  Pull Now ↓
                </Button>
              }
              index="G-01"
              title="Git Synchronize & CLI Execution"
            >
              {/* Upstream Sync Spec */}
              <div>
                <div className="mb-2 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  Upstream Sync Specification
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-2.5 sm:py-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm">
                        origin
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px]">
                      Upstream Remote
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-2.5 sm:py-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm">
                        ⎇ main
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px]">
                      Tracked Branch
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 p-2 sm:px-2.5 sm:py-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-xs sm:text-sm">
                        FF-Only
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-[10px]">
                      Merge Strategy
                    </span>
                  </div>
                </div>
              </div>

              {/* Execution Pipeline & Primary Pull */}
              <div className="space-y-2 border-border/50 border-t pt-3">
                <div className="flex flex-wrap items-center justify-between gap-1 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  <span>Fast-Forward Pipeline</span>
                  <span>Clean Index Verified</span>
                </div>

                <div className="border border-border/70 bg-muted/15 px-3 py-1.5 font-mono text-foreground text-[11px] break-all overflow-x-auto">
                  git fetch --prune origin && git pull --ff-only origin main
                </div>

                <Button
                  className="h-8 w-full rounded-none font-mono text-xs uppercase tracking-wider"
                  disabled={isGitBusy}
                  onClick={handlePull}
                  variant="default"
                >
                  {loading
                    ? "Synchronizing Working Tree..."
                    : "Execute Git Pull ↓"}
                </Button>
              </div>

              {/* Manual Git CLI Command & Presets */}
              <div className="space-y-2 border-border/50 border-t pt-3">
                <div className="flex flex-wrap items-center justify-between gap-1 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  <span>Manual Git Command Execution</span>
                  <span>Press Enter ↵ · ↑↓ History</span>
                </div>

                <form
                  className="flex items-center gap-1.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleExecuteGit();
                  }}
                >
                  <div className="relative flex flex-1 items-center">
                    <span className="pointer-events-none absolute left-2.5 select-none font-bold font-mono text-emerald-500 text-xs">
                      git
                    </span>
                    <Input
                      className="h-8 rounded-none border-border/80 bg-background/80 pl-9 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary"
                      disabled={isGitBusy}
                      onChange={(e) => setManualCommand(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                          e.preventDefault();
                          if (cmdHistory.length > 0) {
                            const nextIdx = Math.min(
                              historyIndex + 1,
                              cmdHistory.length - 1
                            );
                            setHistoryIndex(nextIdx);
                            setManualCommand(cmdHistory[nextIdx]);
                          }
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          if (historyIndex > 0) {
                            const nextIdx = historyIndex - 1;
                            setHistoryIndex(nextIdx);
                            setManualCommand(cmdHistory[nextIdx]);
                          } else if (historyIndex === 0) {
                            setHistoryIndex(-1);
                            setManualCommand("");
                          }
                        }
                      }}
                      placeholder="status, log -n 5, branch -a, checkout main..."
                      value={manualCommand}
                    />
                  </div>
                  <Button
                    className="h-8 shrink-0 rounded-none px-3 font-mono text-xs uppercase tracking-wider"
                    disabled={isGitBusy || !manualCommand.trim()}
                    type="submit"
                    variant="outline"
                  >
                    {executingGit ? "Running..." : "Execute ↵"}
                  </Button>
                </form>

                {/* Quick-action Presets */}
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  <span className="mr-0.5 font-mono text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                    Presets:
                  </span>
                  {GIT_QUICK_ACTIONS.map((preset) => (
                    <button
                      className="border border-border/70 bg-muted/20 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/40 hover:text-foreground disabled:opacity-50"
                      disabled={isGitBusy}
                      key={preset.command}
                      onClick={() => handleExecuteGit(preset.command)}
                      title={preset.description}
                      type="button"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Integrated Verbatim Terminal Output for G-01 */}
                {!lastExecutedCmd?.startsWith("git push") && output && (
                  <div className="space-y-1.5 border-border/50 border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                        Terminal Output
                      </span>
                      <button
                        className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => {
                          setOutput(null);
                          setLastExecutedCmd(null);
                          setLastCmdStatus(null);
                        }}
                        type="button"
                      >
                        Clear ✕
                      </button>
                    </div>
                    <VerbatimOutput
                      label={
                        lastExecutedCmd
                          ? `$ ${lastExecutedCmd}`
                          : "Git Subprocess Output"
                      }
                      ok={lastCmdStatus ?? true}
                      output={output}
                      preClassName="min-h-[60px] max-h-[160px] p-2.5 text-[11px]"
                    />
                  </div>
                )}
              </div>
            </CadCell>

            {/* Right 6 cols: [G-02] Git Commit & Push */}
            <CadCell
              bodyClassName="space-y-4"
              className="md:col-span-6"
              footerLeft="POST /api/git/push · Stage, Commit & Push"
              footerRight="Conventional Commits"
              headerAction={
                gitConfig?.isConfigured ? (
                  <button
                    className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowIdentityEditor((prev) => !prev)}
                    title="Click to edit Git committer identity"
                    type="button"
                  >
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-foreground">
                      {gitConfig.name}
                    </span>
                    <span className="underline decoration-dotted text-primary/80">
                      ✎ Edit
                    </span>
                  </button>
                ) : (
                  <button
                    className="flex items-center gap-1.5 border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-500 hover:bg-amber-500/20 transition-colors"
                    onClick={() => setShowIdentityEditor(true)}
                    type="button"
                  >
                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Setup Identity !</span>
                  </button>
                )
              }
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

              {/* Committer Identity Banner / Editor */}
              {!gitConfig?.isConfigured || showIdentityEditor ? (
                <div className="border border-amber-500/40 bg-amber-500/5 p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground">
                      <span className="size-2 rounded-full bg-amber-500" />
                      <span>Configure GitHub Committer Identity</span>
                    </div>
                    {gitConfig?.isConfigured && (
                      <button
                        className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
                        onClick={() => setShowIdentityEditor(false)}
                        type="button"
                      >
                        ✕ Close
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    GitHub links commits to your profile picture using your{" "}
                    <span className="font-semibold text-foreground">
                      GitHub account email
                    </span>
                    . If unset or a machine default hostname is used, GitHub displays an unlinked avatar.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                    <div className="space-y-1">
                      <label
                        className="font-mono text-[10px] uppercase text-muted-foreground/80"
                        htmlFor="git-author-name"
                      >
                        Full Name / Username
                      </label>
                      <Input
                        className="h-8 rounded-none border-border/80 bg-background font-mono text-xs"
                        disabled={configSaving}
                        id="git-author-name"
                        onChange={(e) => setAuthorNameInput(e.target.value)}
                        placeholder="e.g. Mosabbir Maruf"
                        value={authorNameInput}
                      />
                    </div>
                    <div className="space-y-1">
                      <label
                        className="font-mono text-[10px] uppercase text-muted-foreground/80"
                        htmlFor="git-author-email"
                      >
                        GitHub Account Email
                      </label>
                      <Input
                        className="h-8 rounded-none border-border/80 bg-background font-mono text-xs"
                        disabled={configSaving}
                        id="git-author-email"
                        onChange={(e) => setAuthorEmailInput(e.target.value)}
                        placeholder="e.g. user@users.noreply.github.com"
                        type="email"
                        value={authorEmailInput}
                      />
                    </div>
                  </div>

                  {identityFeedback && (
                    <div className="font-mono text-[11px] text-amber-500 pt-0.5">
                      {identityFeedback}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {gitConfig?.isConfigured && (
                      <Button
                        className="h-7 rounded-none px-3 font-mono text-[10px] uppercase tracking-wider"
                        disabled={configSaving}
                        onClick={() => setShowIdentityEditor(false)}
                        size="xs"
                        variant="ghost"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      className="h-7 rounded-none px-3 font-mono text-[10px] uppercase tracking-wider"
                      disabled={
                        configSaving ||
                        !authorNameInput.trim() ||
                        !authorEmailInput.trim()
                      }
                      onClick={handleSaveIdentity}
                      size="xs"
                    >
                      {configSaving ? "Saving..." : "Save Identity ✓"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between border border-border/60 bg-muted/10 px-2.5 py-1.5 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span className="font-mono text-[11px] text-muted-foreground truncate">
                      Committer:{" "}
                      <span className="font-semibold text-foreground">
                        {gitConfig.name}
                      </span>{" "}
                      &lt;{gitConfig.email}&gt;
                    </span>
                  </div>
                  <button
                    className="font-mono text-[10px] text-primary hover:underline ml-2 shrink-0"
                    onClick={() => setShowIdentityEditor(true)}
                    type="button"
                  >
                    Change
                  </button>
                </div>
              )}

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
                  disabled={isGitBusy}
                  id="git-commit-msg"
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="feat(workstation): update environment definitions..."
                  value={commitMessage}
                />

                <Button
                  className="h-9 w-full rounded-none font-mono text-xs uppercase tracking-wider"
                  disabled={isGitBusy || !commitMessage.trim()}
                  type="submit"
                >
                  {loading
                    ? "Staging, Committing & Pushing..."
                    : "Stage, Commit & Push ↑"}
                </Button>

                {/* Integrated Verbatim Terminal Output for G-02 */}
                {lastExecutedCmd?.startsWith("git push") && output && (
                  <div className="space-y-1.5 border-border/50 border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                        Terminal Output
                      </span>
                      <button
                        className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => {
                          setOutput(null);
                          setLastExecutedCmd(null);
                          setLastCmdStatus(null);
                        }}
                        type="button"
                      >
                        Clear ✕
                      </button>
                    </div>
                    <VerbatimOutput
                      label={
                        lastExecutedCmd
                          ? `$ ${lastExecutedCmd}`
                          : "Git Commit & Push"
                      }
                      ok={lastCmdStatus ?? true}
                      output={output}
                      preClassName="min-h-[60px] max-h-[160px] p-2.5 text-[11px]"
                    />
                  </div>
                )}
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
              <span className="max-w-[200px] truncate sm:max-w-none">
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
                ) : isDaemonRestartRequired ? (
                  <Badge
                    className="border-amber-500/40 bg-amber-500/10 text-amber-500 font-mono text-[10px] uppercase"
                    size="sm"
                    variant="outline"
                  >
                    Daemon Update Required
                  </Badge>
                ) : isDiffError ? (
                  <Badge
                    className="border-destructive/40 bg-destructive/10 text-destructive font-mono text-[10px] uppercase"
                    size="sm"
                    variant="outline"
                  >
                    Diff Error
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
                  disabled={diffLoading || isGitBusy}
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
                      isDaemonRestartRequired
                        ? "bg-amber-500"
                        : isDiffError
                        ? "bg-destructive"
                        : diffData?.clean
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                    )}
                  />
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-semibold text-foreground">
                    {isDaemonRestartRequired
                      ? "Host Daemon Restart Required"
                      : isDiffError
                      ? "Git Diff Inspection Error"
                      : diffData?.clean
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

              {/* Diff Code Display, Clean State, or Actionable Alert */}
              {diffLoading && !diffData ? (
                <div className="flex min-h-[140px] items-center justify-center border border-border/70 border-dashed bg-muted/10 p-4 text-center font-mono text-muted-foreground/60 text-xs">
                  Computing working tree diff...
                </div>
              ) : isDaemonRestartRequired ? (
                <div className="flex flex-col gap-3 border border-amber-500/40 bg-amber-500/5 p-4 sm:p-5">
                  <div className="flex items-center gap-2 font-mono text-xs font-semibold text-amber-500">
                    <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                    Host Control Daemon Endpoint Not Loaded (/api/git/diff)
                  </div>
                  <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                    The host control daemon running on your server is an earlier process instance without the git diff route. Restart the daemon to activate live working tree telemetry:
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="border border-border/80 bg-background/80 px-2.5 py-1 font-mono text-xs text-foreground select-all">
                      ai daemon restart
                    </code>
                    <span className="font-mono text-[10px] text-muted-foreground/60 uppercase">or</span>
                    <code className="border border-border/80 bg-background/80 px-2.5 py-1 font-mono text-xs text-foreground select-all">
                      sudo systemctl restart ai-workstation-daemon
                    </code>
                  </div>
                  <div className="pt-1">
                    <Button
                      className="h-7 rounded-none px-3 font-mono text-xs uppercase tracking-wider"
                      disabled={diffLoading || isGitBusy}
                      onClick={fetchDiff}
                      size="xs"
                      variant="outline"
                    >
                      {diffLoading ? "Probing..." : "Recheck Daemon ↻"}
                    </Button>
                  </div>
                </div>
              ) : isDiffError ? (
                <div className="border border-destructive/50 bg-destructive/10 p-3 font-mono text-destructive text-xs">
                  {diffError || diffData?.output || "Failed to inspect git diff."}
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
                        git diff HEAD{diffLines.length > MAX_DIFF_LINES ? ` · Showing first ${MAX_DIFF_LINES} of ${diffLines.length} lines` : ""}
                      </span>
                    </div>
                    <CopyButton
                      aria-label="Copy diff"
                      className="size-6 shrink-0 rounded-none border border-border/60"
                      text={diffData?.diff || ""}
                    />
                  </div>

                  <div className="max-h-[360px] min-h-[120px] select-text overflow-x-auto overflow-y-auto p-2 font-mono text-xs leading-relaxed">
                    {visibleDiffLines.map((line, idx) => (
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
                    {diffLines.length > MAX_DIFF_LINES ? (
                      <div className="mt-2 border-border/50 border-t pt-2 text-center font-mono text-[11px] text-muted-foreground/70">
                        ... ({diffLines.length - MAX_DIFF_LINES} lines hidden). Use the copy button above for the complete diff.
                      </div>
                    ) : null}
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
    </div>
  );
}
