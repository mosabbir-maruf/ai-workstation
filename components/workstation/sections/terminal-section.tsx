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

  const outputEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Command history navigation
  const [navIndex, setNavIndex] = useState<number>(-1);
  const pastCommands = useRef<string[]>([]);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleRunCommand = async (cmdToRun?: string, explicitTarget?: "host" | "workstation") => {
    const cmd = (cmdToRun ?? commandInput).trim();
    if (!cmd || executing) return;

    const chosenTarget = explicitTarget ?? target;
    setExecuting(true);
    if (!cmdToRun) setCommandInput("");

    // Store in command navigation buffer
    pastCommands.current.push(cmd);
    setNavIndex(-1);

    try {
      const res = await workstationApi.executeTerminalCommand({
        command: cmd,
        target: chosenTarget,
      });

      setHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          command: cmd,
          target: chosenTarget,
          output: res.output || (res.ok ? "(Command exited with code 0 without output)" : "Command failed"),
          ok: res.ok,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err) {
      setHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          command: cmd,
          target: chosenTarget,
          output: `Execution error: ${err instanceof Error ? err.message : String(err)}`,
          ok: false,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setExecuting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
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
        <div className="relative w-full overflow-visible">
          <div className="grid w-full grid-cols-1">
            <CadCell
              index="02"
              title="Remote Workstation Console & CLI"
              subtitle="Direct interactive CLI shell targeting host VPS or container sandbox"
              headerAction={
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-border bg-muted/20 p-0.5">
                    <button
                      type="button"
                      onClick={() => setTarget("host")}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider transition-colors",
                        target === "host"
                          ? "bg-foreground text-background font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Host (VPS)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTarget("workstation")}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider transition-colors",
                        target === "workstation"
                          ? "bg-foreground text-background font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Container (/workspace)
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs font-mono rounded-none"
                    onClick={() => setHistory([])}
                  >
                    Clear Screen
                  </Button>
                </div>
              }
              bodyClassName="p-0"
              footerLeft={`Active environment: ${target === "host" ? "Host Debian / Ubuntu OS ($HOME/ai-workstation-cli)" : "Workstation Sandbox Container (/workspace)"}`}
              footerRight={
                <Badge variant="outline" className="text-[10px] font-mono uppercase">
                  Connected via HTTPS / Cloudflare Tunnel
                </Badge>
              }
            >
              <div className="flex flex-col h-[520px] bg-black text-emerald-400 font-mono text-xs">
                {/* Quick command buttons toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 p-2.5 border-b border-zinc-800 bg-zinc-950">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider mr-1">
                    Presets:
                  </span>
                  {QUICK_COMMANDS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleRunCommand(item.cmd, item.target as "host" | "workstation")}
                      disabled={executing}
                      className="px-2 py-0.5 text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors disabled:opacity-50"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Terminal logs / history scroll area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
                  {history.length === 0 ? (
                    <div className="text-zinc-600 text-center py-12">
                      Terminal buffer cleared. Enter a command below.
                    </div>
                  ) : (
                    history.map((item) => (
                      <div key={item.id} className="space-y-1.5 border-b border-zinc-900 pb-3">
                        <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className={item.ok ? "text-emerald-500" : "text-rose-500"}>
                              {item.target === "host" ? "mosabbir@cloud:~$" : "sandbox@container:/workspace$"}
                            </span>
                            <span className="text-zinc-100 font-semibold">{item.command}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px]">{item.timestamp}</span>
                            <CopyButton text={item.output} className="h-5 w-5 p-0.5 text-zinc-400 hover:text-zinc-100" />
                          </div>
                        </div>
                        <pre className={cn(
                          "whitespace-pre-wrap break-all leading-relaxed p-2.5 rounded bg-zinc-950/70 border text-xs",
                          item.ok ? "border-zinc-800/60 text-zinc-300" : "border-rose-950/80 text-rose-300"
                        )}>
                          {item.output}
                        </pre>
                      </div>
                    ))
                  )}
                  <div ref={outputEndRef} />
                </div>

                {/* Input prompt line */}
                <div className="flex items-center gap-2 p-3 bg-zinc-950 border-t border-zinc-800">
                  <span className="text-emerald-400 select-none font-bold">
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
                      target === "host"
                        ? "Run host CLI command (e.g. ai status, ai pull, docker ps)..."
                        : "Run container command (e.g. npm test, ls -la, git diff)..."
                    }
                    className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-600 font-mono text-xs focus:ring-0"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleRunCommand()}
                    disabled={executing || !commandInput.trim()}
                    className="h-7 px-3 text-xs font-mono rounded-none bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"
                  >
                    {executing ? "Running..." : "Execute"}
                  </Button>
                </div>
              </div>
            </CadCell>
          </div>
        </div>
      </CadGridFrame>
    </div>
  );
}
