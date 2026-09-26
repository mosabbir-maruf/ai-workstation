"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GridCornerDots } from "@/components/design/line-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { workstationApi } from "@/lib/workstation/api";
import { CadCell, CadGridFrame } from "../cad-primitives";
import { VerbatimOutput } from "../verbatim-output";

function maskSecret(secret: string): string {
  const trimmed = secret.trim();
  if (!trimmed) {
    return "UNSET";
  }
  if (trimmed.length <= 8) {
    return "••••••••";
  }
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}

export function DshKeysSection() {
  const [content, setContent] = useState("");
  const [mtime, setMtime] = useState<string | null>(null);
  const [actionOutput, setActionOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealKeys, setRevealKeys] = useState(false);

  const [deepseekKey, setDeepseekKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await workstationApi.getDshSettings();
      if (res.ok) {
        setContent(res.content);
        setMtime(res.mtime);

        try {
          const parsed = JSON.parse(res.content);
          setDeepseekKey(parsed.api_providers?.deepseek?.api_key ?? "");
          setOpenaiKey(parsed.api_providers?.openai?.api_key ?? "");
          setAnthropicKey(parsed.api_providers?.anthropic?.api_key ?? "");
        } catch {
          // Non-JSON or custom structure
        }
      }
    } catch (err) {
      setActionOutput(`Failed to fetch DSH settings: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const buildSyncedJson = useCallback(
    (rawContent: string) => {
      try {
        const parsed = JSON.parse(rawContent || "{}");
        if (!parsed.api_providers || typeof parsed.api_providers !== "object") {
          parsed.api_providers = {};
        }
        if (!parsed.api_providers.deepseek) {
          parsed.api_providers.deepseek = {};
        }
        if (!parsed.api_providers.openai) {
          parsed.api_providers.openai = {};
        }
        if (!parsed.api_providers.anthropic) {
          parsed.api_providers.anthropic = {};
        }

        if (deepseekKey.trim()) {
          parsed.api_providers.deepseek.api_key = deepseekKey.trim();
        }
        if (openaiKey.trim()) {
          parsed.api_providers.openai.api_key = openaiKey.trim();
        }
        if (anthropicKey.trim()) {
          parsed.api_providers.anthropic.api_key = anthropicKey.trim();
        }

        return JSON.stringify(parsed, null, 2);
      } catch {
        return rawContent;
      }
    },
    [anthropicKey, deepseekKey, openaiKey]
  );

  const handleStageToJson = () => {
    const nextJson = buildSyncedJson(content);
    setContent(nextJson);
    setActionOutput(
      "[Stage Provider Keys]\nInjected staged API keys into dsh-settings JSON editor payload."
    );
  };

  const handleSave = async (payloadOverride?: string) => {
    const payloadToSave = payloadOverride ?? content;
    try {
      setLoading(true);
      const res = await workstationApi.saveDshSettings(payloadToSave);
      setActionOutput(`[POST /api/dsh-settings]\n${res.output}`);
      await fetchSettings();
    } catch (err) {
      setActionOutput(`Failed to save settings: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAndSave = async () => {
    const nextJson = buildSyncedJson(content);
    setContent(nextJson);
    await handleSave(nextJson);
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(content || "{}");
      setContent(JSON.stringify(parsed, null, 2));
    } catch (err) {
      setActionOutput(`JSON format error: ${String(err)}`);
    }
  };

  const jsonTelemetry = useMemo(() => {
    const byteLength = content ? content.length : 0;
    try {
      const parsed = JSON.parse(content || "{}");
      const providers = parsed?.api_providers ?? {};
      const configuredCount = ["deepseek", "openai", "anthropic"].filter(
        (key) => Boolean(providers?.[key]?.api_key?.trim?.())
      ).length;
      return {
        valid: true,
        configuredCount,
        byteLength,
      };
    } catch {
      return {
        valid: false,
        configuredCount: 0,
        byteLength,
      };
    }
  }, [content]);

  const providerRows = useMemo(
    () => [
      {
        id: "deepseek",
        name: "DeepSeek API",
        models: "deepseek-chat / deepseek-reasoner",
        envVar: "DEEPSEEK_API_KEY",
        value: deepseekKey,
      },
      {
        id: "openai",
        name: "OpenAI Platform",
        models: "gpt-4o / o3-mini",
        envVar: "OPENAI_API_KEY",
        value: openaiKey,
      },
      {
        id: "anthropic",
        name: "Anthropic Claude",
        models: "claude-3-7-sonnet",
        envVar: "ANTHROPIC_API_KEY",
        value: anthropicKey,
      },
    ],
    [anthropicKey, deepseekKey, openaiKey]
  );

  return (
    <div className="space-y-10 md:space-y-11">
      {/* Row 1: Balanced 6/6 CAD Grid — Provider Key Vault + Raw JSON Payload Editor */}
      <CadGridFrame>
        <div className="relative w-full overflow-visible">
          <div className="grid w-full grid-cols-1 md:grid-cols-12">
            {/* [K-01] Model Provider API Keys */}
            <CadCell
              bodyClassName="flex flex-col justify-between gap-4 p-5"
              className="md:col-span-6"
              footerLeft="Keystore: /etc/dsh/config.json"
              footerRight="AES-256 VAULT"
              headerAction={
                <>
                  <Button
                    className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                    disabled={loading}
                    onClick={() => setRevealKeys((prev) => !prev)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    {revealKeys ? "Mask" : "Reveal"}
                  </Button>
                  <Button
                    className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                    disabled={loading}
                    onClick={handleStageToJson}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Stage JSON
                  </Button>
                  <Button
                    className="h-6 rounded-none px-2.5 font-mono text-[10px] uppercase tracking-wider"
                    disabled={loading}
                    onClick={handleSyncAndSave}
                    size="sm"
                    type="button"
                    variant="default"
                  >
                    Sync & Apply
                  </Button>
                </>
              }
              index="K-01"
              title="Model Provider API Keys"
            >
              {/* Top: 3-Column Provider Vault Specification */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Provider Keystore Status
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    api_providers.*
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {providerRows.map((provider) => {
                    const isConfigured = Boolean(provider.value.trim());
                    return (
                      <div
                        className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5"
                        key={provider.id}
                      >
                        <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                          {provider.id}
                        </span>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className={cn(
                              "size-1.5 shrink-0 rounded-full",
                              isConfigured
                                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.65)]"
                                : "bg-amber-500"
                            )}
                          />
                          <span className="truncate font-bold font-mono text-foreground text-xs">
                            {isConfigured ? "STAGED" : "UNSET"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Middle & Bottom: Provider Key Inputs */}
              <div className="space-y-3 border-border/50 border-t pt-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest"
                      htmlFor="deepseek-key"
                    >
                      DeepSeek API Key
                    </label>
                    <span className="font-mono text-[9px] text-muted-foreground">
                      deepseek-chat / reasoner
                    </span>
                  </div>
                  <Input
                    className="h-8 rounded-none font-mono text-xs"
                    disabled={loading}
                    id="deepseek-key"
                    onChange={(e) => setDeepseekKey(e.target.value)}
                    placeholder="dsk_live_... or sk-..."
                    type={revealKeys ? "text" : "password"}
                    value={deepseekKey}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest"
                      htmlFor="openai-key"
                    >
                      OpenAI API Key
                    </label>
                    <span className="font-mono text-[9px] text-muted-foreground">
                      gpt-4o / o3-mini
                    </span>
                  </div>
                  <Input
                    className="h-8 rounded-none font-mono text-xs"
                    disabled={loading}
                    id="openai-key"
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    type={revealKeys ? "text" : "password"}
                    value={openaiKey}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest"
                      htmlFor="anthropic-key"
                    >
                      Anthropic API Key
                    </label>
                    <span className="font-mono text-[9px] text-muted-foreground">
                      claude-3-7-sonnet
                    </span>
                  </div>
                  <Input
                    className="h-8 rounded-none font-mono text-xs"
                    disabled={loading}
                    id="anthropic-key"
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    placeholder="sk-ant-..."
                    type={revealKeys ? "text" : "password"}
                    value={anthropicKey}
                  />
                </div>
              </div>
            </CadCell>

            {/* [K-02] dsh-settings Configuration Payload */}
            <CadCell
              bodyClassName="flex flex-col justify-between gap-4 p-5"
              className="md:col-span-6"
              footerLeft={`Modified: ${mtime || "unknown"}`}
              footerRight="GET/POST /api/dsh-settings"
              headerAction={
                <>
                  <Button
                    className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                    disabled={loading}
                    onClick={handleFormatJson}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Format
                  </Button>
                  <Button
                    className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                    disabled={loading}
                    onClick={fetchSettings}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Reload ↻
                  </Button>
                  <Button
                    className="h-6 rounded-none px-2.5 font-mono text-[10px] uppercase tracking-wider"
                    disabled={loading || !jsonTelemetry.valid}
                    onClick={() => handleSave()}
                    size="sm"
                    type="button"
                    variant="default"
                  >
                    Save Payload
                  </Button>
                </>
              }
              index="K-02"
              title="dsh-settings Configuration Payload"
            >
              {/* Top: 3-Column JSON Schema Telemetry */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Payload Schema Telemetry
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    application/json
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      JSON Syntax
                    </span>
                    <span
                      className={cn(
                        "mt-1 truncate font-bold font-mono text-xs",
                        jsonTelemetry.valid
                          ? "text-emerald-500"
                          : "text-destructive"
                      )}
                    >
                      {jsonTelemetry.valid ? "VALID JSON" : "SYNTAX ERR"}
                    </span>
                  </div>
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Vault Keys
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-foreground text-xs">
                      {jsonTelemetry.configuredCount} / 3 ACTIVE
                    </span>
                  </div>
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 px-3 py-2.5">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Payload Size
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-foreground text-xs">
                      {jsonTelemetry.byteLength} B
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle & Bottom: Raw JSON Configuration Editor */}
              <div className="space-y-1.5 border-border/50 border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Raw DSH Provider Routing & Quota JSON
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground">
                    UTF-8
                  </span>
                </div>
                <Textarea
                  className="h-[172px] resize-none rounded-none font-mono text-xs leading-relaxed"
                  disabled={loading}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder='{"api_providers": {"deepseek": {"api_key": "..."}}}'
                  spellCheck={false}
                  value={content}
                />
              </div>
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

      {/* Row 2: Balanced 6/6 CAD Grid — Provider Fingerprint Audit Matrix + Mutation Output */}
      <CadGridFrame>
        <div className="relative w-full overflow-visible">
          <div className="grid w-full grid-cols-1 md:grid-cols-12">
            {/* [K-03] Provider Key Fingerprint & Routing Matrix */}
            <CadCell
              bodyClassName="flex flex-col justify-between gap-4 p-5"
              className="md:col-span-6"
              footerLeft="Masked credential fingerprint audit"
              footerRight="RUNTIME ENV INJECTION"
              headerAction={
                <Button
                  className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                  disabled={loading}
                  onClick={fetchSettings}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Refresh ↻
                </Button>
              }
              index="K-03"
              title="Provider Key Fingerprint & Routing Matrix"
            >
              <div className="divide-y divide-border/60 border border-border/60 bg-muted/5">
                {providerRows.map((provider) => {
                  const configured = Boolean(provider.value.trim());
                  return (
                    <div
                      className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                      key={provider.id}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "size-1.5 shrink-0 rounded-full",
                              configured ? "bg-emerald-500" : "bg-amber-500"
                            )}
                          />
                          <span className="font-bold font-mono text-foreground text-xs">
                            {provider.name}
                          </span>
                          <span className="border border-border/60 bg-muted/20 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                            {provider.envVar}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                          Default routing: {provider.models}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className={cn(
                            "block font-mono text-xs",
                            configured
                              ? "font-semibold text-emerald-500"
                              : "text-muted-foreground"
                          )}
                        >
                          {maskSecret(provider.value)}
                        </span>
                        <span className="font-mono text-[9px] text-muted-foreground uppercase">
                          {configured ? "VAULT READY" : "MISSING KEY"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CadCell>

            {/* [K-04] Configuration Mutation Output */}
            <CadCell
              bodyClassName="p-0"
              className="md:col-span-6"
              footerLeft="Response payload from GET/POST /api/dsh-settings"
              footerRight="EXECUTION LOG"
              headerAction={
                actionOutput ? (
                  <Button
                    className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                    onClick={() => setActionOutput(null)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Clear
                  </Button>
                ) : null
              }
              index="K-04"
              title="Configuration Mutation Output"
            >
              <VerbatimOutput
                className="min-h-[200px] border-0 shadow-none"
                label="POST /api/dsh-settings"
                output={
                  actionOutput ??
                  "Ready. Sync provider keys or save the dsh-settings JSON payload above to inspect mutation output."
                }
              />
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
    </div>
  );
}
