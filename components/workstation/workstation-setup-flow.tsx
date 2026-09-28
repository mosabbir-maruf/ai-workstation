"use client";

import { useEffect, useState, useCallback, useRef, type DragEvent } from "react";
import Link from "next/link";
import { workstationApi } from "@/lib/workstation/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/copy-button";

interface WorkstationSetupFlowProps {
  onComplete: () => void;
}

export function WorkstationSetupFlow({ onComplete }: WorkstationSetupFlowProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // System states
  const [daemonActive, setDaemonActive] = useState<boolean>(false);
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null);
  const [projectsList, setProjectsList] = useState<Array<{ name: string; active: boolean }>>([]);
  const [githubConfigured, setGithubConfigured] = useState<boolean>(false);
  const [tunnelConfigured, setTunnelConfigured] = useState<boolean>(false);
  const [dshKeysConfigured, setDshKeysConfigured] = useState<boolean>(false);

  // Form inputs for inline setup
  const [cloneUrl, setCloneUrl] = useState("");
  const [appId, setAppId] = useState("");
  const [installationId, setInstallationId] = useState("");
  const [pemText, setPemText] = useState("");
  const [pemFileName, setPemFileName] = useState<string | null>(null);
  const [isDraggingPem, setIsDraggingPem] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tunnelToken, setTunnelToken] = useState("");
  const [tunnelAppHost, setTunnelAppHost] = useState("");
  const [tunnelDshHost, setTunnelDshHost] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<
    "deepseek" | "openai" | "anthropic" | "gemini" | "openrouter" | "groq" | "custom"
  >("deepseek");
  const [deepseekKey, setDeepseekKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [revealKey, setRevealKey] = useState(false);

  const handlePemFileSelected = (file: File) => {
    if (!file) return;
    setPemFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setPemText(text.trim());
      }
    };
    reader.readAsText(file);
  };

  const handlePemDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPem(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handlePemFileSelected(file);
    }
  };

  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true);
      const [hRes, pRes, gRes, tRes, dRes] = await Promise.allSettled([
        workstationApi.getHealth(),
        workstationApi.getProjects(),
        workstationApi.getGithubStatus(),
        workstationApi.getTunnelStatus(),
        workstationApi.getDshSettings(),
      ]);

      const daemonOk = hRes.status === "fulfilled" && hRes.value.ok;
      setDaemonActive(daemonOk);

      if (pRes.status === "fulfilled" && pRes.value.ok) {
        setProjectsList(pRes.value.projects || []);
        const found = pRes.value.projects?.find((p) => p.active);
        setActiveProjectName(found ? found.name : null);
      }

      if (gRes.status === "fulfilled" && gRes.value.ok) {
        const out = gRes.value.output || "";
        const isConfigured =
          !out.includes("not configured") &&
          (out.includes("Authentication:  OK") || out.includes("Broker socket:   ready"));
        setGithubConfigured(isConfigured);
      }

      if (tRes.status === "fulfilled" && tRes.value.ok) {
        const out = (tRes.value.output || "").toLowerCase();
        const isTunnelOk =
          out.includes("active") ||
          out.includes("connected") ||
          out.includes("running") ||
          out.includes("configured");
        setTunnelConfigured(isTunnelOk);
      }

      if (dRes.status === "fulfilled" && dRes.value.ok) {
        try {
          const parsed = JSON.parse(dRes.value.content || "{}");
          const providers = parsed?.api_providers || {};

          if (providers.deepseek?.api_key) setDeepseekKey(providers.deepseek.api_key);
          if (providers.openai?.api_key) setOpenaiKey(providers.openai.api_key);
          if (providers.anthropic?.api_key) setAnthropicKey(providers.anthropic.api_key);
          if (providers.gemini?.api_key || providers.google?.api_key) {
            setGeminiKey(providers.gemini?.api_key || providers.google?.api_key);
          }
          if (providers.openrouter?.api_key) setOpenrouterKey(providers.openrouter.api_key);
          if (providers.groq?.api_key) setGroqKey(providers.groq.api_key);
          if (providers.custom?.api_key || providers.custom?.base_url) {
            setCustomApiKey(providers.custom.api_key || "");
            setCustomBaseUrl(providers.custom.base_url || "");
            setCustomModel(providers.custom.model || "");
          }

          const hasAny = Boolean(
            providers.deepseek?.api_key ||
            providers.openai?.api_key ||
            providers.anthropic?.api_key ||
            providers.gemini?.api_key ||
            providers.google?.api_key ||
            providers.openrouter?.api_key ||
            providers.groq?.api_key ||
            providers.custom?.api_key ||
            providers.custom?.base_url
          );
          setDshKeysConfigured(hasAny);
        } catch {
          setDshKeysConfigured(
            Boolean(dRes.value.content && dRes.value.content.length > 20 && !dRes.value.content.includes("EMPTY"))
          );
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Actions
  const handleSelectProject = async (name: string) => {
    try {
      setActionLoading(true);
      setActionFeedback(null);
      const res = await workstationApi.activateProject(name);
      setActionFeedback(res.output);
      await refreshStatus();
    } catch (err) {
      setActionFeedback(`Failed: ${String(err)}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloneProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneUrl.trim()) return;
    try {
      setActionLoading(true);
      setActionFeedback(null);
      const res = await workstationApi.addProject(cloneUrl.trim());
      setActionFeedback(res.output);
      setCloneUrl("");
      await refreshStatus();
    } catch (err) {
      setActionFeedback(`Failed: ${String(err)}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(appId.trim() && installationId.trim() && pemText.trim())) return;
    try {
      setActionLoading(true);
      setActionFeedback(null);
      const res = await workstationApi.setupGithub(appId.trim(), installationId.trim(), pemText.trim());
      setActionFeedback(res.output);
      await refreshStatus();
    } catch (err) {
      setActionFeedback(`Failed: ${String(err)}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveTunnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tunnelToken.trim()) return;
    try {
      setActionLoading(true);
      setActionFeedback(null);
      const res = await workstationApi.setupTunnel({
        token: tunnelToken.trim(),
        appHost: tunnelAppHost.trim() || undefined,
        dshHost: tunnelDshHost.trim() || undefined,
      });
      setActionFeedback(res.output);
      await refreshStatus();
    } catch (err) {
      setActionFeedback(`Failed: ${String(err)}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveModelKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setActionFeedback(null);

      // Preserve existing settings
      let parsedSettings: Record<string, any> = {};
      try {
        const currentRes = await workstationApi.getDshSettings();
        if (currentRes.ok && currentRes.content) {
          parsedSettings = JSON.parse(currentRes.content);
        }
      } catch {
        // default empty
      }

      if (!parsedSettings.api_providers || typeof parsedSettings.api_providers !== "object") {
        parsedSettings.api_providers = {};
      }

      if (deepseekKey.trim()) {
        parsedSettings.api_providers.deepseek = {
          ...parsedSettings.api_providers.deepseek,
          api_key: deepseekKey.trim(),
        };
      }
      if (openaiKey.trim()) {
        parsedSettings.api_providers.openai = {
          ...parsedSettings.api_providers.openai,
          api_key: openaiKey.trim(),
        };
      }
      if (anthropicKey.trim()) {
        parsedSettings.api_providers.anthropic = {
          ...parsedSettings.api_providers.anthropic,
          api_key: anthropicKey.trim(),
        };
      }
      if (geminiKey.trim()) {
        parsedSettings.api_providers.gemini = {
          ...parsedSettings.api_providers.gemini,
          api_key: geminiKey.trim(),
        };
      }
      if (openrouterKey.trim()) {
        parsedSettings.api_providers.openrouter = {
          ...parsedSettings.api_providers.openrouter,
          api_key: openrouterKey.trim(),
        };
      }
      if (groqKey.trim()) {
        parsedSettings.api_providers.groq = {
          ...parsedSettings.api_providers.groq,
          api_key: groqKey.trim(),
        };
      }
      if (customApiKey.trim() || customBaseUrl.trim()) {
        parsedSettings.api_providers.custom = {
          ...parsedSettings.api_providers.custom,
          api_key: customApiKey.trim(),
          base_url: customBaseUrl.trim(),
          model: customModel.trim(),
        };
      }

      const res = await workstationApi.saveDshSettings(JSON.stringify(parsedSettings, null, 2));
      setActionFeedback(res.output || "Model provider keys saved successfully.");
      await refreshStatus();
    } catch (err) {
      setActionFeedback(`Failed: ${String(err)}`);
    } finally {
      setActionLoading(false);
    }
  };

  const steps = [
    {
      id: "daemon",
      num: "01",
      badge: "Connection",
      title: "Workstation Daemon Host",
      desc: "Connect to your remote VPS server over Cloudflare Tunnel or local daemon port.",
      done: daemonActive,
      status: daemonActive ? "Connected (200 OK)" : "Host Offline or 401",
      docLink: "/docs/installation",
      docTitle: "Host Installation & Daemon Docs",
    },
    {
      id: "project",
      num: "02",
      badge: "Workspace",
      title: "Mount Project Repository",
      desc: "Choose an active codebase to mount inside the isolated container workspace.",
      done: Boolean(activeProjectName),
      status: activeProjectName ? `Active: ${activeProjectName}` : "No Project Active",
      docLink: "/docs/cli-reference",
      docTitle: "Workspace Management Docs",
    },
    {
      id: "github",
      num: "03",
      badge: "VCS Auth",
      title: "GitHub App Broker",
      desc: "Authenticate Git pull/push operations without storing SSH keys or PATs in the container.",
      done: githubConfigured,
      status: githubConfigured ? "Broker Active" : "Setup Required",
      docLink: "/docs/github-app-setup",
      docTitle: "GitHub App Setup Guide",
    },
    {
      id: "tunnel",
      num: "04",
      badge: "Edge Tunnel",
      title: "Cloudflare Edge Tunnel",
      desc: "Expose dev-server and DeepSeek harness securely with zero open inbound ports.",
      done: tunnelConfigured,
      status: tunnelConfigured ? "Connected" : "Not Configured",
      docLink: "/docs/cloudflare-tunnel",
      docTitle: "Cloudflare Tunnel Setup Guide",
    },
    {
      id: "dsh-keys",
      num: "05",
      badge: "AI Agent",
      title: "DSH AI Model Keys",
      desc: "Configure LLM provider keys for autonomous container code execution and agent sessions.",
      done: dshKeysConfigured,
      status: dshKeysConfigured ? "Keys Saved" : "Keys Missing",
      docLink: "/docs/harness-and-dsh",
      docTitle: "Harness & DSH Model Config Docs",
    },
  ];

  const current = steps[currentStepIndex];
  const completedCount = steps.filter((s) => s.done).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="mx-auto max-w-4xl py-6 space-y-8 animate-in fade-in duration-300">
      {/* Top Application Setup Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Setup & Configuration Wizard
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Let&apos;s set up your AI Workstation
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete these 5 essential modules to get your workstation ready for development and agent workloads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStatus}
            disabled={loading}
            className="h-9 px-3 font-mono text-xs"
          >
            {loading ? "Checking..." : "Recheck All"}
          </Button>
          <Button
            size="sm"
            onClick={onComplete}
            variant="secondary"
            className="h-9 px-4 font-mono text-xs"
          >
            Go to Console →
          </Button>
        </div>
      </div>

      {/* Modern Stepper Navigation Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>PROGRESS: {progressPercent}% COMPLETED</span>
          <span>
            {completedCount} OF {steps.length} CONFIGURED
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-muted overflow-hidden rounded-full">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Capsules Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-2">
          {steps.map((st, idx) => {
            const isSelected = idx === currentStepIndex;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={cn(
                  "flex flex-col text-left p-3 rounded-lg border transition-all text-xs",
                  isSelected
                    ? "border-foreground bg-muted/30 shadow-xs"
                    : st.done
                    ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60"
                    : "border-border/60 bg-card hover:border-border"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                    STEP {st.num}
                  </span>
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      st.done ? "bg-emerald-500" : "bg-muted-foreground/30"
                    )}
                  />
                </div>
                <span className="font-semibold text-foreground truncate">
                  {st.title}
                </span>
                <span
                  className={cn(
                    "font-mono text-[10px] mt-1 truncate",
                    st.done
                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                      : "text-amber-600 dark:text-amber-400"
                  )}
                >
                  {st.status}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Step Card */}
      <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
        {/* Step Title & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px] uppercase">
                {current.badge}
              </Badge>
              <span className="font-mono text-xs text-muted-foreground">
                Step {current.num} of 05
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {current.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {current.desc}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {current.docLink && (
              <Link
                href={current.docLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors px-1"
              >
                Docs ↗
              </Link>
            )}
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-xs px-2.5 py-1",
                current.done
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              )}
            >
              {current.done ? "● Configured & Ready" : "○ Action Required"}
            </Badge>
          </div>
        </div>

        {/* Action Feedback Notification */}
        {actionFeedback && (
          <div
            className={cn(
              "p-3 text-xs font-mono rounded-md border",
              actionFeedback.includes("ERROR:") ||
                actionFeedback.includes("Failed:") ||
                actionFeedback.includes("failed")
                ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
            )}
          >
            <pre className="whitespace-pre-wrap font-mono">{actionFeedback}</pre>
          </div>
        )}

        {/* Step-Specific Interactive Panel */}
        <div className="pt-2">
          {/* STEP 1: HOST DAEMON */}
          {current.id === "daemon" && (
            <div className="space-y-5">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Host Daemon Health Probe
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    GET /api/health
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The Python 3 asynchronous workstation daemon manages process supervisors, Docker container isolation, and logs.
                </p>
                <div className="p-3 bg-black rounded font-mono text-xs text-emerald-400 flex items-center justify-between">
                  <span>
                    Status: {daemonActive ? '200 OK — {"ok": true, "output": "Host workstation daemon active."}' : '401 Unauthorized / Daemon Unreachable'}
                  </span>
                  <CopyButton text="curl -i -H 'Authorization: Bearer <token>' https://api.hypersync.dev.cv/api/health" className="h-6 w-6 text-zinc-400" />
                </div>
              </div>

              {!daemonActive && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2 text-xs font-mono text-amber-700 dark:text-amber-300">
                  <p className="font-bold">To start daemon on your VPS:</p>
                  <pre className="p-2 bg-black text-amber-300 rounded overflow-x-auto">
                    sudo systemctl restart ai-workstation-daemon
                  </pre>
                  <p>
                    Verify that your <code>WORKSTATION_API_KEY</code> is set in <code>.env</code>.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PROJECT WORKSPACE */}
          {current.id === "project" && (
            <div className="space-y-6">
              {/* Existing Projects List */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-foreground">
                  Select an Existing Repository:
                </span>
                {projectsList.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                    No repositories found in ~/projects on your VPS. Add one below.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {projectsList.map((pr) => (
                      <div
                        key={pr.name}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-colors",
                          pr.active
                            ? "border-emerald-500 bg-emerald-500/10 text-foreground font-semibold"
                            : "border-border/70 hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={cn("size-2 rounded-full", pr.active ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                          <span className="text-xs truncate">{pr.name}</span>
                        </div>
                        {pr.active ? (
                          <Badge variant="outline" className="text-[10px] font-mono border-emerald-500 text-emerald-500">
                            ACTIVE
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSelectProject(pr.name)}
                            disabled={actionLoading}
                            className="h-7 text-xs font-mono"
                          >
                            Mount
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Clone New Project */}
              <form onSubmit={handleCloneProject} className="space-y-3 pt-3 border-t border-border/60">
                <span className="text-xs font-semibold text-foreground">
                  Or Clone a New Git Repository:
                </span>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={cloneUrl}
                    onChange={(e) => setCloneUrl(e.target.value)}
                    placeholder="https://github.com/username/repository.git"
                    className="text-xs font-mono"
                  />
                  <Button
                    type="submit"
                    disabled={actionLoading || !cloneUrl.trim()}
                    className="h-9 font-mono text-xs px-4"
                  >
                    {actionLoading ? "Cloning..." : "Clone & Mount"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: GITHUB APP BROKER */}
          {current.id === "github" && (
            <div className="space-y-5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your GitHub App to enable seamless Git pull/push inside the container.
                Enter your App ID, Installation ID, and paste your downloaded <code>.pem</code> private key.
              </p>

              <form onSubmit={handleSaveGithub} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      GitHub App ID
                    </label>
                    <Input
                      type="text"
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      placeholder="e.g. 1023456"
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      Installation ID
                    </label>
                    <Input
                      type="text"
                      value={installationId}
                      onChange={(e) => setInstallationId(e.target.value)}
                      placeholder="e.g. 56789012"
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground">
                      Private Key (.pem)
                    </label>
                    {pemFileName && (
                      <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                        ✓ Loaded: {pemFileName}
                      </span>
                    )}
                  </div>

                  {/* Drag & Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingPem(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingPem(false);
                    }}
                    onDrop={handlePemDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-all",
                      isDraggingPem
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-border/70 bg-muted/10 hover:border-border hover:bg-muted/20"
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pem,.key,text/plain"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handlePemFileSelected(e.target.files[0]);
                        }
                      }}
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <svg
                        className="size-5 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.75}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <span className="font-mono text-xs font-medium text-foreground">
                        Drag & drop your downloaded <code className="text-emerald-600 dark:text-emerald-400">.pem</code> file here
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        or click to browse from your device
                      </span>
                    </div>
                  </div>

                  {/* Verbatim Textarea for fallback inspection / editing */}
                  <div className="pt-1">
                    <Textarea
                      rows={3}
                      value={pemText}
                      onChange={(e) => {
                        setPemText(e.target.value);
                        setPemFileName(null);
                      }}
                      placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                      className="text-xs font-mono resize-none text-muted-foreground focus:text-foreground"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={actionLoading || !(appId.trim() && installationId.trim() && pemText.trim())}
                  className="font-mono text-xs px-5"
                >
                  {actionLoading ? "Saving & Testing..." : "Save & Authenticate GitHub Broker"}
                </Button>
              </form>
            </div>
          )}

          {/* STEP 4: CLOUDFLARE TUNNEL */}
          {current.id === "tunnel" && (
            <div className="space-y-5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Configure your Cloudflare Zero Trust tunnel connector token to expose your app preview and DSH agent endpoints.
              </p>

              <form onSubmit={handleSaveTunnel} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Cloudflare Tunnel Token
                  </label>
                  <Input
                    type="password"
                    value={tunnelToken}
                    onChange={(e) => setTunnelToken(e.target.value)}
                    placeholder="eyJhIjoi..."
                    className="text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      App Hostname (optional)
                    </label>
                    <Input
                      type="text"
                      value={tunnelAppHost}
                      onChange={(e) => setTunnelAppHost(e.target.value)}
                      placeholder="app.hypersync.dev.cv"
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      DSH Agent Hostname (optional)
                    </label>
                    <Input
                      type="text"
                      value={tunnelDshHost}
                      onChange={(e) => setTunnelDshHost(e.target.value)}
                      placeholder="dsh.hypersync.dev.cv"
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={actionLoading || !tunnelToken.trim()}
                  className="font-mono text-xs px-5"
                >
                  {actionLoading ? "Installing..." : "Configure & Install Tunnel"}
                </Button>
              </form>
            </div>
          )}

          {/* STEP 5: DSH MODEL KEYS */}
          {current.id === "dsh-keys" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Configure API keys for DeepSeek, OpenAI, Anthropic, Gemini, OpenRouter, Groq, or custom endpoints. Multiple providers can be configured simultaneously.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRevealKey((prev) => !prev)}
                  className="h-7 text-[11px] font-mono shrink-0 self-start sm:self-auto"
                >
                  {revealKey ? "Mask Keys" : "Reveal Keys"}
                </Button>
              </div>

              {/* Provider Selection Tabs */}
              <div className="flex flex-wrap gap-1.5 p-1 bg-muted/20 border border-border/60 rounded-md">
                {[
                  { id: "deepseek", name: "DeepSeek", keyVal: deepseekKey },
                  { id: "openai", name: "OpenAI", keyVal: openaiKey },
                  { id: "anthropic", name: "Anthropic", keyVal: anthropicKey },
                  { id: "gemini", name: "Google Gemini", keyVal: geminiKey },
                  { id: "openrouter", name: "OpenRouter", keyVal: openrouterKey },
                  { id: "groq", name: "Groq", keyVal: groqKey },
                  { id: "custom", name: "Custom / Local", keyVal: customApiKey || customBaseUrl },
                ].map((prov) => {
                  const isSelected = selectedProvider === prov.id;
                  const isConfigured = Boolean(prov.keyVal?.trim());
                  return (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => setSelectedProvider(prov.id as any)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all",
                        isSelected
                          ? "bg-background text-foreground shadow-sm border border-border/80 font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full shrink-0",
                          isConfigured ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" : "bg-muted-foreground/30"
                        )}
                      />
                      <span>{prov.name}</span>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleSaveModelKey} className="space-y-4">
                {selectedProvider === "deepseek" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      DeepSeek API Key
                    </label>
                    <Input
                      type={revealKey ? "text" : "password"}
                      value={deepseekKey}
                      onChange={(e) => setDeepseekKey(e.target.value)}
                      placeholder="sk-..."
                      className="text-xs font-mono"
                    />
                  </div>
                )}

                {selectedProvider === "openai" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      OpenAI API Key
                    </label>
                    <Input
                      type={revealKey ? "text" : "password"}
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-proj-..."
                      className="text-xs font-mono"
                    />
                  </div>
                )}

                {selectedProvider === "anthropic" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Anthropic Claude API Key
                    </label>
                    <Input
                      type={revealKey ? "text" : "password"}
                      value={anthropicKey}
                      onChange={(e) => setAnthropicKey(e.target.value)}
                      placeholder="sk-ant-..."
                      className="text-xs font-mono"
                    />
                  </div>
                )}

                {selectedProvider === "gemini" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Google Gemini API Key
                    </label>
                    <Input
                      type={revealKey ? "text" : "password"}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="text-xs font-mono"
                    />
                  </div>
                )}

                {selectedProvider === "openrouter" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      OpenRouter API Key
                    </label>
                    <Input
                      type={revealKey ? "text" : "password"}
                      value={openrouterKey}
                      onChange={(e) => setOpenrouterKey(e.target.value)}
                      placeholder="sk-or-v1-..."
                      className="text-xs font-mono"
                    />
                  </div>
                )}

                {selectedProvider === "groq" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Groq API Key
                    </label>
                    <Input
                      type={revealKey ? "text" : "password"}
                      value={groqKey}
                      onChange={(e) => setGroqKey(e.target.value)}
                      placeholder="gsk_..."
                      className="text-xs font-mono"
                    />
                  </div>
                )}

                {selectedProvider === "custom" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">
                        Base URL
                      </label>
                      <Input
                        type="text"
                        value={customBaseUrl}
                        onChange={(e) => setCustomBaseUrl(e.target.value)}
                        placeholder="http://localhost:11434/v1 or https://..."
                        className="text-xs font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">
                          API Key (optional)
                        </label>
                        <Input
                          type={revealKey ? "text" : "password"}
                          value={customApiKey}
                          onChange={(e) => setCustomApiKey(e.target.value)}
                          placeholder="sk-..."
                          className="text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">
                          Model Identifier (optional)
                        </label>
                        <Input
                          type="text"
                          value={customModel}
                          onChange={(e) => setCustomModel(e.target.value)}
                          placeholder="deepseek-r1 or qwen2.5-coder"
                          className="text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Configured Status Summary */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40 text-[11px] font-mono text-muted-foreground">
                  <span>Configured:</span>
                  {[
                    { name: "DeepSeek", has: Boolean(deepseekKey.trim()) },
                    { name: "OpenAI", has: Boolean(openaiKey.trim()) },
                    { name: "Anthropic", has: Boolean(anthropicKey.trim()) },
                    { name: "Gemini", has: Boolean(geminiKey.trim()) },
                    { name: "OpenRouter", has: Boolean(openrouterKey.trim()) },
                    { name: "Groq", has: Boolean(groqKey.trim()) },
                    { name: "Custom", has: Boolean(customApiKey.trim() || customBaseUrl.trim()) },
                  ]
                    .filter((p) => p.has)
                    .map((p) => (
                      <span
                        key={p.name}
                        className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20"
                      >
                        <span className="size-1 rounded-full bg-emerald-500" />
                        {p.name}
                      </span>
                    ))}
                  {![deepseekKey, openaiKey, anthropicKey, geminiKey, openrouterKey, groqKey, customApiKey, customBaseUrl].some((k) => Boolean(k?.trim())) && (
                    <span className="italic text-muted-foreground/60">No keys configured yet</span>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={
                      actionLoading ||
                      ![deepseekKey, openaiKey, anthropicKey, geminiKey, openrouterKey, groqKey, customApiKey, customBaseUrl].some((k) => Boolean(k?.trim()))
                    }
                    className="font-mono text-xs px-5"
                  >
                    {actionLoading ? "Saving Provider Keys..." : "Save Model Provider Keys"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentStepIndex === 0}
            className="font-mono text-xs"
          >
            ← Previous Step
          </Button>

          {currentStepIndex < steps.length - 1 ? (
            <Button
              size="sm"
              onClick={() => {
                refreshStatus();
                setCurrentStepIndex((prev) => prev + 1);
              }}
              className="font-mono text-xs"
            >
              Continue to Step {steps[currentStepIndex + 1].num} →
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onComplete}
              className="font-mono text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-5"
            >
              Complete Setup & Open Console
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
