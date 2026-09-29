"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { CadCell, CadGridFrame } from "../cad-primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { workstationApi } from "@/lib/workstation/api";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

interface CommandHistoryItem {
  id: string;
  command: string;
  target: "host" | "workstation";
  output: string;
  ok: boolean;
  timestamp: string;
}

const QUICK_COMMANDS = [
  { label: "ai status", cmd: "ai status", target: "host" },
  { label: "ai doctor", cmd: "ai doctor", target: "host" },
  { label: "docker ps", cmd: "docker ps", target: "host" },
  { label: "ls -la /workspace", cmd: "ls -la /workspace", target: "workstation" },
  { label: "git status", cmd: "git status", target: "workstation" },
  { label: "node -v", cmd: "node -v && npm -v", target: "workstation" },
  { label: "systemctl status", cmd: "systemctl status ai-workstation-daemon --no-pager", target: "host" },
] as const;

const INTERACTIVE_CONFIRM_REGEX =
  /(\[y\/n\]|\[n\/y\]|\(y\/n\)|are you sure you want to continue\?|do you want to continue\?)\s*$/i;

export function TerminalSection() {
  const [target, setTarget] = useState<"host" | "workstation">("host");
  const [commandInput, setCommandInput] = useState("");
  const [executing, setExecuting] = useState(false);
  const [history, setHistory] = useState<CommandHistoryItem[]>([
    {
      id: "initial",
      command: "ai status",
      target: "host",
      output: "Workstation terminal active. Select Host or Container target and run commands.",
      ok: true,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [sudoPromptPending, setSudoPromptPending] = useState<{
    command: string;
    target: "host" | "workstation";
  } | null>(null);
  const [sudoPasswordInput, setSudoPasswordInput] = useState("");
  const sudoPasswordRef = useRef<HTMLInputElement>(null);

  const [confirmPromptPending, setConfirmPromptPending] = useState<{
    command: string;
    target: "host" | "workstation";
    sudoPassword?: string;
  } | null>(null);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Command history navigation
  const [navIndex, setNavIndex] = useState<number>(-1);
  const pastCommands = useRef<string[]>([]);

  useEffect(() => {
    // Only scroll the terminal inner container, NOT the outer window/page
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [history]);

  const handleRunCommand = async (
    cmdToRun?: string,
    explicitTarget?: "host" | "workstation",
    sudoPassword?: string,
    displayCommand?: string
  ) => {
    const rawInput = (cmdToRun ?? commandInput).trim();
    if (!rawInput || executing) return;

    const normalizedLower = rawInput.toLowerCase();

    // Handle [y/N] confirmation responses if a previous command prompted for confirmation
    if (
      confirmPromptPending &&
      !displayCommand &&
      (normalizedLower === "y" ||
        normalizedLower === "yes" ||
        normalizedLower === "n" ||
        normalizedLower === "no")
    ) {
      const pending = confirmPromptPending;
      setConfirmPromptPending(null);
      if (!cmdToRun) setCommandInput("");

      if (normalizedLower === "n" || normalizedLower === "no") {
        setHistory((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            command: rawInput,
            target: pending.target,
            output: `Cancelled: ${pending.command}`,
            ok: true,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        return;
      }

      const confirmedCommand = pending.command.startsWith("sudo ")
        ? `sudo sh -c 'yes | ${pending.command.slice(5).trim()}'`
        : `yes | ${pending.command}`;

      await handleRunCommand(
        confirmedCommand,
        pending.target,
        pending.sudoPassword,
        `${rawInput} → ${pending.command}`
      );
      return;
    }

    setConfirmPromptPending(null);
    const cmd = rawInput;
    const shownCmd = displayCommand ?? cmd;
    const chosenTarget = explicitTarget ?? target;

    const promptForSudo = () => {
      setSudoPromptPending({ command: cmd, target: chosenTarget });
      setSudoPasswordInput("");
      setTimeout(() => sudoPasswordRef.current?.focus({ preventScroll: true }), 50);
    };

    // If running on host, begins with 'sudo' and no password entered yet, prompt for password interactively
    if (chosenTarget === "host" && !sudoPassword && (cmd.startsWith("sudo ") || cmd === "sudo")) {
      promptForSudo();
      if (!cmdToRun) setCommandInput("");
      return;
    }

    setExecuting(true);
    if (!cmdToRun) setCommandInput("");

    // Store in command navigation buffer
    if (!displayCommand) {
      pastCommands.current.push(cmd);
    }
    setNavIndex(-1);

    try {
      const res = await workstationApi.executeTerminalCommand({
        command: cmd,
        target: chosenTarget,
        sudoPassword,
      });

      // If backend reports that sudo authentication is required, open sudo password prompt
      if (!res.ok && res.requiresSudo && !sudoPassword) {
        promptForSudo();
        return;
      }

      const trimmedOut = (res.output || "").trim();
      const needsConfirmation =
        !displayCommand && INTERACTIVE_CONFIRM_REGEX.test(trimmedOut);

      if (needsConfirmation) {
        setConfirmPromptPending({
          command: cmd,
          target: chosenTarget,
          sudoPassword,
        });
      }

      setHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          command: shownCmd,
          target: chosenTarget,
          output:
            res.output ||
            (res.ok
              ? "(Command exited with code 0 without output)"
              : "Command failed"),
          ok: res.ok,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err) {
      setHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          command: shownCmd,
          target: chosenTarget,
          output: `Execution error: ${err instanceof Error ? err.message : String(err)}`,
          ok: false,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setExecuting(false);
      if (typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches) {
        setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
      }
    }
  };

  const handleRunSudoWithPassword = () => {
    if (!sudoPromptPending || !sudoPasswordInput) return;
    const { command: pendingCmd, target: pendingTarget } = sudoPromptPending;
    const pwd = sudoPasswordInput;
    setSudoPromptPending(null);
    setSudoPasswordInput("");
    handleRunCommand(pendingCmd, pendingTarget, pwd);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRunCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (pastCommands.current.length > 0) {
        const nextIndex =
          navIndex === -1 ? pastCommands.current.length - 1 : Math.max(0, navIndex - 1);
        setNavIndex(nextIndex);
        setCommandInput(pastCommands.current[nextIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (navIndex !== -1) {
        const nextIndex = navIndex + 1;
        if (nextIndex >= pastCommands.current.length) {
          setNavIndex(-1);
          setCommandInput("");
        } else {
          setNavIndex(nextIndex);
          setCommandInput(pastCommands.current[nextIndex]);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* CAD Terminal Execution Cell */}
      <CadGridFrame>
        <div className="relative w-full min-w-0 max-w-full overflow-visible">
          <div className="grid w-full min-w-0 max-w-full grid-cols-1">
            <CadCell
              index="02"
              title="Remote Workstation Console & CLI"
              subtitle="Direct interactive CLI shell targeting host VPS or container sandbox"
              headerAction={
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center border border-border bg-muted/20 p-0.5">
                    <button
                      type="button"
                      onClick={() => setTarget("host")}
                      className={cn(
                        "px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider transition-colors",
                        target === "host"
                          ? "bg-foreground text-background font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>Host</span>
                      <span className="hidden sm:inline"> (VPS)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTarget("workstation")}
                      className={cn(
                        "px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider transition-colors",
                        target === "workstation"
                          ? "bg-foreground text-background font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>Container</span>
                      <span className="hidden sm:inline"> (/workspace)</span>
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs font-mono rounded-none"
                    onClick={() => setHistory([])}
                  >
                    <span className="sm:hidden">Clear</span>
                    <span className="hidden sm:inline">Clear Screen</span>
                  </Button>
                </div>
              }
              bodyClassName="p-0"
              footerLeft={`Active environment: ${target === "host" ? "Host Debian / Ubuntu OS ($HOME/ai-workstation-cli)" : "Workstation Sandbox Container (/workspace)"}`}
              footerRight={
                <Badge variant="outline" className="text-[10px] font-mono uppercase">
                  <span className="sm:hidden">Tunnel Active</span>
                  <span className="hidden sm:inline">Connected via HTTPS / Cloudflare Tunnel</span>
                </Badge>
              }
            >
              <div className="flex flex-col h-[420px] sm:h-[520px] max-h-[75vh] w-full min-w-0 max-w-full overflow-hidden bg-black text-emerald-400 font-mono text-xs">
                {/* Quick command buttons toolbar */}
                <div className="flex w-full min-w-0 shrink-0 items-center gap-1.5 p-2 sm:p-2.5 border-b border-zinc-800 bg-zinc-950 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider mr-1 shrink-0">
                    Presets:
                  </span>
                  {QUICK_COMMANDS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleRunCommand(item.cmd, item.target as "host" | "workstation")}
                      disabled={executing}
                      className="px-2 py-1 text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors disabled:opacity-50 shrink-0 whitespace-nowrap"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Terminal logs / history scroll area */}
                <div
                  ref={logContainerRef}
                  className="flex-1 w-full min-w-0 overflow-y-auto overflow-x-auto overscroll-contain p-3 sm:p-4 space-y-4 select-text"
                >
                  {history.length === 0 ? (
                    <div className="text-zinc-600 text-center py-12">
                      Terminal buffer cleared. Enter a command below.
                    </div>
                  ) : (
                    history.map((item) => (
                      <div key={item.id} className="space-y-1.5 border-b border-zinc-900 pb-3">
                        <div className="flex flex-wrap items-center justify-between gap-1 text-zinc-500 text-[11px]">
                          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className={cn("shrink-0 font-semibold", item.ok ? "text-emerald-500" : "text-rose-500")}>
                              <span className="hidden sm:inline">{item.target === "host" ? "mosabbir@cloud:~$" : "sandbox@container:/workspace$"}</span>
                              <span className="sm:hidden">{item.target === "host" ? "host$" : "container$"}</span>
                            </span>
                            <span className="text-zinc-100 font-semibold break-all">{item.command}</span>
                          </div>
                          <div className="flex shrink-0 items-center gap-2 ml-auto">
                            <span className="text-[10px]">{item.timestamp}</span>
                            <CopyButton text={item.output} className="h-5 w-5 p-0.5 text-zinc-400 hover:text-zinc-100" />
                          </div>
                        </div>
                        <pre className={cn(
                          "w-full min-w-0 whitespace-pre-wrap break-all leading-relaxed p-2.5 rounded bg-zinc-950/70 border text-xs",
                          item.ok ? "border-zinc-800/60 text-zinc-300" : "border-rose-950/80 text-rose-300"
                        )}>
                          {item.output}
                        </pre>
                      </div>
                    ))
                  )}
                </div>

                {/* Optional [y/N] Interactive Confirmation Strip */}
                {confirmPromptPending && !sudoPromptPending && (
                  <div className="flex w-full min-w-0 shrink-0 flex-wrap items-center justify-between gap-2 border-t border-amber-500/40 bg-amber-950/30 px-3 py-2 text-xs">
                    <div className="flex min-w-0 items-center gap-2 text-amber-300">
                      <span className="shrink-0 font-bold uppercase">[y/N]</span>
                      <span className="truncate">
                        Confirm execution of <code className="text-amber-100">{confirmPromptPending.command}</code>? (Type <code className="text-amber-100">y</code> or <code className="text-amber-100">n</code> below)
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        className="h-6 rounded-none bg-emerald-600 px-2.5 font-mono text-[11px] text-white hover:bg-emerald-500"
                        disabled={executing}
                        onClick={() => handleRunCommand("y")}
                        size="xs"
                        type="button"
                      >
                        Confirm (y)
                      </Button>
                      <Button
                        className="h-6 rounded-none border-zinc-700 bg-zinc-900 px-2.5 font-mono text-[11px] text-zinc-300 hover:bg-zinc-800"
                        disabled={executing}
                        onClick={() => handleRunCommand("n")}
                        size="xs"
                        type="button"
                        variant="outline"
                      >
                        Abort (n)
                      </Button>
                    </div>
                  </div>
                )}

                {/* Input prompt line or Sudo password prompt */}
                {sudoPromptPending ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRunSudoWithPassword();
                    }}
                    className="flex w-full min-w-0 shrink-0 flex-col sm:flex-row sm:items-center gap-2 p-2.5 sm:p-3 bg-amber-950/40 border-t border-amber-500/50 animate-in fade-in duration-150"
                  >
                    <div className="flex items-center gap-1.5 shrink-0 text-amber-400 select-none font-bold text-xs">
                      <span>🔒</span>
                      <span>[sudo] password for host:</span>
                    </div>
                    <input
                      ref={sudoPasswordRef}
                      type="password"
                      value={sudoPasswordInput}
                      onChange={(e) => setSudoPasswordInput(e.target.value)}
                      placeholder="Type VPS password (never saved)..."
                      className="w-full sm:flex-1 bg-black/70 border border-amber-500/40 rounded px-2.5 py-1.5 text-zinc-100 placeholder:text-zinc-600 font-mono text-base sm:text-xs outline-none focus:border-amber-400"
                    />
                    <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={executing || !sudoPasswordInput}
                        className="h-8 sm:h-7 px-3 text-xs font-mono rounded-none bg-amber-500 hover:bg-amber-400 text-black font-semibold disabled:opacity-40"
                      >
                        {executing ? "Authenticating..." : "Authenticate ↵"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSudoPromptPending(null);
                          setSudoPasswordInput("");
                        }}
                        className="h-8 sm:h-7 px-2.5 text-xs font-mono text-zinc-400 hover:text-zinc-100"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRunCommand();
                    }}
                    className="flex w-full min-w-0 shrink-0 items-center gap-2 p-2.5 sm:p-3 bg-zinc-950 border-t border-zinc-800"
                  >
                    <span className="text-emerald-400 select-none font-bold text-xs shrink-0">
                      {target === "host" ? "host>" : "container>"}
                    </span>
                    <input
                      ref={inputRef}
                      type="text"
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={executing}
                      placeholder={
                        confirmPromptPending
                          ? `Type 'y' to confirm '${confirmPromptPending.command}' or 'n' to cancel...`
                          : target === "host"
                            ? "Run host CLI command (e.g. ai status, docker ps)..."
                            : "Run container command (e.g. npm test, ls -la)..."
                      }
                      className="flex-1 min-w-0 bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-600 font-mono text-base sm:text-xs focus:ring-0"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={executing || !commandInput.trim()}
                      className="h-8 sm:h-7 px-3 text-xs font-mono rounded-none bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 shrink-0"
                    >
                      {executing ? "Running..." : "Execute"}
                    </Button>
                  </form>
                )}
              </div>
            </CadCell>
          </div>
        </div>
      </CadGridFrame>
    </div>
  );
}
