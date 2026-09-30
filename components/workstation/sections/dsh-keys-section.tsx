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
import { ModelDropdownSelector } from "../model-dropdown-selector";

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

type ProviderId =
  | "deepseek"
  | "openai"
  | "anthropic"
  | "gemini"
  | "openrouter"
  | "groq"
  | "custom";

export function DshKeysSection() {
  const [content, setContent] = useState("");
  const [mtime, setMtime] = useState<string | null>(null);
  const [actionOutput, setActionOutput] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<"keys" | "payload" | "matrix" | null>(null);
  const [actionOk, setActionOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealKeys, setRevealKeys] = useState(false);

  // Active provider selection tab
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>("deepseek");

  // Provider API Keys & Base URLs
  const [deepseekKey, setDeepseekKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [customModel, setCustomModel] = useState("");

  // Model discovery & identifiers
  const [providerModels, setProviderModels] = useState<Record<string, string>>({
    deepseek: "",
    openai: "",
    anthropic: "",
    gemini: "",
    openrouter: "",
    groq: "",
    custom: "",
  });
  const [availableModels, setAvailableModels] = useState<Record<string, string[]>>({});
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelFetchNotice, setModelFetchNotice] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await workstationApi.getDshSettings();
      if (res.ok) {
        setContent(res.content);
        setMtime(res.mtime);

        try {
          const parsed = JSON.parse(res.content);
          const providers = parsed.api_providers || {};

          setDeepseekKey(providers.deepseek?.api_key ?? "");
          setOpenaiKey(providers.openai?.api_key ?? "");
          setAnthropicKey(providers.anthropic?.api_key ?? "");
          setGeminiKey(providers.gemini?.api_key ?? providers.google?.api_key ?? "");
          setOpenrouterKey(providers.openrouter?.api_key ?? "");
          setGroqKey(providers.groq?.api_key ?? "");

          setCustomApiKey(providers.custom?.api_key ?? "");
          setCustomBaseUrl(providers.custom?.base_url ?? "");
          setCustomModel(providers.custom?.model ?? "");

          setProviderModels({
            deepseek: providers.deepseek?.model ?? "",
            openai: providers.openai?.model ?? "",
            anthropic: providers.anthropic?.model ?? "",
            gemini: providers.gemini?.model ?? providers.google?.model ?? "",
            openrouter: providers.openrouter?.model ?? "",
            groq: providers.groq?.model ?? "",
            custom: providers.custom?.model ?? "",
          });
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

  const getProviderApiKey = (prov: string): string => {
    switch (prov) {
      case "deepseek": return deepseekKey;
      case "openai": return openaiKey;
      case "anthropic": return anthropicKey;
      case "gemini": return geminiKey;
      case "openrouter": return openrouterKey;
      case "groq": return groqKey;
      case "custom": return customApiKey;
      default: return "";
    }
  };

  const handleFetchModels = async (prov: string) => {
    try {
      setFetchingModels(true);
      setModelFetchNotice(null);
      const apiKey = getProviderApiKey(prov).trim();
      const baseUrl = prov === "custom" ? customBaseUrl.trim() : undefined;

      const res = await workstationApi.fetchAvailableModels({
        provider: prov,
        apiKey: apiKey || undefined,
        baseUrl: baseUrl || undefined,
      });

      if (res.ok && res.models && res.models.length > 0) {
        setAvailableModels((prev) => ({ ...prev, [prov]: res.models }));
        setProviderModels((prev) => {
          if (!prev[prov]?.trim()) {
            return { ...prev, [prov]: res.models[0] };
          }
          return prev;
        });
        if (prov === "custom") {
          setCustomModel((prev) => prev || res.models[0]);
        }
        setModelFetchNotice(`Discovered ${res.models.length} available model(s).`);
      } else {
        setModelFetchNotice(res.error || "No models returned. Check credentials or host URL.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setModelFetchNotice(`Error fetching models: ${msg}`);
    } finally {
      setFetchingModels(false);
    }
  };

  const buildSyncedJson = useCallback(
    (rawContent: string) => {
      try {
        const parsed = JSON.parse(rawContent || "{}");
        if (!parsed.api_providers || typeof parsed.api_providers !== "object") {
          parsed.api_providers = {};
        }

        const syncProv = (prov: string, keyVal: string, modelVal?: string, baseUrlVal?: string) => {
          if (keyVal?.trim() || modelVal?.trim() || baseUrlVal?.trim()) {
            const nextEntry: Record<string, string> = {};
            if (keyVal?.trim()) nextEntry.api_key = keyVal.trim();
            if (modelVal?.trim()) nextEntry.model = modelVal.trim();
            if (baseUrlVal?.trim()) nextEntry.base_url = baseUrlVal.trim();
            parsed.api_providers[prov] = nextEntry;
          } else {
            delete parsed.api_providers[prov];
            if (prov === "gemini") {
              delete parsed.api_providers.google;
            }
          }
        };

        syncProv("deepseek", deepseekKey, providerModels.deepseek);
        syncProv("openai", openaiKey, providerModels.openai);
        syncProv("anthropic", anthropicKey, providerModels.anthropic);
        syncProv("gemini", geminiKey, providerModels.gemini);
        syncProv("openrouter", openrouterKey, providerModels.openrouter);
        syncProv("groq", groqKey, providerModels.groq);
        syncProv("custom", customApiKey, customModel || providerModels.custom, customBaseUrl);

        return JSON.stringify(parsed, null, 2);
      } catch {
        return rawContent;
      }
    },
    [
      anthropicKey,
      customApiKey,
      customBaseUrl,
      customModel,
      deepseekKey,
      geminiKey,
      groqKey,
      openaiKey,
      openrouterKey,
      providerModels,
    ]
  );

  const handleStageToJson = () => {
    const nextJson = buildSyncedJson(content);
    setContent(nextJson);
    setLastAction("keys");
    setActionOk(true);
    setActionOutput(
      "[Stage Provider Keys]\nInjected staged API keys and model identifiers into dsh-settings JSON editor payload."
    );
  };

  const handleSave = async (
    payloadOverride?: string,
    logHeader = "[POST /api/dsh-settings]",
    source: "keys" | "payload" | "matrix" = "payload"
  ) => {
    const payloadToSave = payloadOverride ?? content;
    try {
      setLoading(true);
      setLastAction(source);
      const res = await workstationApi.saveDshSettings(payloadToSave);
      setActionOutput(`${logHeader}\n${res.output || "Settings saved successfully."}`);
      setActionOk(res.ok ?? true);
      await fetchSettings();
    } catch (err) {
      setActionOutput(`Failed to save settings: ${String(err)}`);
      setActionOk(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProvider = async (provId: ProviderId, provName: string) => {
    switch (provId) {
      case "deepseek":
        setDeepseekKey("");
        break;
      case "openai":
        setOpenaiKey("");
        break;
      case "anthropic":
        setAnthropicKey("");
        break;
      case "gemini":
        setGeminiKey("");
        break;
      case "openrouter":
        setOpenrouterKey("");
        break;
      case "groq":
        setGroqKey("");
        break;
      case "custom":
        setCustomApiKey("");
        setCustomBaseUrl("");
        setCustomModel("");
        break;
    }
    setProviderModels((prev) => ({ ...prev, [provId]: "" }));

    let nextJson = content;
    try {
      const parsed = JSON.parse(content || "{}");
      if (parsed.api_providers && typeof parsed.api_providers === "object") {
        delete parsed.api_providers[provId];
        if (provId === "gemini") {
          delete parsed.api_providers.google;
        }
      }
      nextJson = JSON.stringify(parsed, null, 2);
    } catch {
      // fallback if raw content wasn't valid JSON
    }

    setContent(nextJson);
    await handleSave(nextJson, `[DELETE Provider → ${provName}]`, "matrix");
  };

  const handleSyncAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nextJson = buildSyncedJson(content);
    setContent(nextJson);
    await handleSave(nextJson, "[POST /api/dsh-settings]", "keys");
  };

  const handleFormatJson = () => {
    try {
      setLastAction("payload");
      const parsed = JSON.parse(content || "{}");
      setContent(JSON.stringify(parsed, null, 2));
      setActionOk(true);
      setActionOutput("[JSON Format]\nSuccessfully parsed and formatted dsh-settings JSON.");
    } catch (err) {
      setLastAction("payload");
      setActionOk(false);
      setActionOutput(`JSON format error: ${String(err)}`);
    }
  };

  const jsonTelemetry = useMemo(() => {
    const byteLength = content ? content.length : 0;
    try {
      const parsed = JSON.parse(content || "{}");
      const providers = parsed?.api_providers ?? {};
      const configuredCount = [
        "deepseek",
        "openai",
        "anthropic",
        "gemini",
        "openrouter",
        "groq",
        "custom",
      ].filter(
        (key) =>
          Boolean(providers?.[key]?.api_key?.trim?.()) ||
          Boolean(providers?.[key]?.base_url?.trim?.()) ||
          Boolean(providers?.[key]?.model?.trim?.())
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
        id: "deepseek" as ProviderId,
        name: "DeepSeek",
        tabName: "DeepSeek",
        models: providerModels.deepseek || "deepseek-chat",
        envVar: "DEEPSEEK_API_KEY",
        value: deepseekKey,
        configured: Boolean(deepseekKey.trim() || providerModels.deepseek?.trim()),
      },
      {
        id: "openai" as ProviderId,
        name: "OpenAI",
        tabName: "OpenAI",
        models: providerModels.openai || "gpt-4o",
        envVar: "OPENAI_API_KEY",
        value: openaiKey,
        configured: Boolean(openaiKey.trim() || providerModels.openai?.trim()),
      },
      {
        id: "anthropic" as ProviderId,
        name: "Anthropic Claude",
        tabName: "Anthropic",
        models: providerModels.anthropic || "claude-3-7-sonnet-20250219",
        envVar: "ANTHROPIC_API_KEY",
        value: anthropicKey,
        configured: Boolean(anthropicKey.trim() || providerModels.anthropic?.trim()),
      },
      {
        id: "gemini" as ProviderId,
        name: "Google Gemini",
        tabName: "Google Gemini",
        models: providerModels.gemini || "gemini-2.0-flash",
        envVar: "GEMINI_API_KEY",
        value: geminiKey,
        configured: Boolean(geminiKey.trim() || providerModels.gemini?.trim()),
      },
      {
        id: "openrouter" as ProviderId,
        name: "OpenRouter",
        tabName: "OpenRouter",
        models: providerModels.openrouter || "deepseek/deepseek-r1",
        envVar: "OPENROUTER_API_KEY",
        value: openrouterKey,
        configured: Boolean(openrouterKey.trim() || providerModels.openrouter?.trim()),
      },
      {
        id: "groq" as ProviderId,
        name: "Groq",
        tabName: "Groq",
        models: providerModels.groq || "llama-3.3-70b-versatile",
        envVar: "GROQ_API_KEY",
        value: groqKey,
        configured: Boolean(groqKey.trim() || providerModels.groq?.trim()),
      },
      {
        id: "custom" as ProviderId,
        name: "Custom / Local",
        tabName: "Custom / Local",
        models: customModel || providerModels.custom || "deepseek-r1",
        envVar: customBaseUrl || "CUSTOM_ENDPOINT",
        value: customApiKey || customBaseUrl,
        configured: Boolean(
          customApiKey.trim() ||
            customBaseUrl.trim() ||
            customModel.trim() ||
            providerModels.custom?.trim()
        ),
      },
    ],
    [
      anthropicKey,
      customApiKey,
      customBaseUrl,
      customModel,
      deepseekKey,
      geminiKey,
      groqKey,
      openaiKey,
      openrouterKey,
      providerModels,
    ]
  );

  const isAnyConfigured = useMemo(
    () => providerRows.some((r) => r.configured),
    [providerRows]
  );

  return (
    <div className="space-y-10 md:space-y-11">
      {/* Row 1: Balanced 6/6 CAD Grid — Interactive Provider & Model Discovery Console + Raw JSON Payload Editor */}
      <CadGridFrame>
        <div className="relative w-full overflow-visible">
          <div className="grid w-full grid-cols-1 md:grid-cols-12">
            {/* [K-01] Model Provider & Auto-Discovery Console (Flows Design) */}
            <CadCell
              bodyClassName="flex flex-col justify-between gap-4 p-5"
              className="md:col-span-6"
              footerLeft="Runtime: runtime/dsh/settings.yaml"
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
                    disabled={loading || !isAnyConfigured}
                    onClick={handleSyncAndSave}
                    size="sm"
                    type="button"
                    variant="default"
                  >
                    {loading ? "Applying..." : "Sync & Apply"}
                  </Button>
                </>
              }
              index="K-01"
              title="DSH AI Model Keys & Provider Discovery"
            >
              <div className="space-y-4">
                {/* Provider Selection Tabs */}
                <div className="flex items-center gap-1 p-1 bg-muted/20 border border-border/60 rounded overflow-x-auto no-scrollbar">
                  {providerRows.map((prov) => {
                    const isSelected = selectedProvider === prov.id;
                    return (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => {
                          setSelectedProvider(prov.id);
                          setModelFetchNotice(null);
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono transition-all shrink-0 whitespace-nowrap",
                          isSelected
                            ? "bg-background text-foreground shadow-sm border border-border/80 font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full shrink-0",
                            prov.configured
                              ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                              : "bg-muted-foreground/30"
                          )}
                        />
                        <span>{prov.tabName}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Provider Key Input */}
                <div className="space-y-3 pt-1">
                  {selectedProvider === "deepseek" && (
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                        DeepSeek API Key
                      </label>
                      <Input
                        type={revealKeys ? "text" : "password"}
                        value={deepseekKey}
                        onChange={(e) => setDeepseekKey(e.target.value)}
                        placeholder="sk-... or dsk_live_..."
                        className="h-9 sm:h-8 rounded-none font-mono text-base sm:text-xs"
                      />
                    </div>
                  )}

                  {selectedProvider === "openai" && (
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                        OpenAI API Key
                      </label>
                      <Input
                        type={revealKeys ? "text" : "password"}
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        placeholder="sk-proj-..."
                        className="h-9 sm:h-8 rounded-none font-mono text-base sm:text-xs"
                      />
                    </div>
                  )}

                  {selectedProvider === "anthropic" && (
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                        Anthropic Claude API Key
                      </label>
                      <Input
                        type={revealKeys ? "text" : "password"}
                        value={anthropicKey}
                        onChange={(e) => setAnthropicKey(e.target.value)}
                        placeholder="sk-ant-..."
                        className="h-9 sm:h-8 rounded-none font-mono text-base sm:text-xs"
                      />
                    </div>
                  )}

                  {selectedProvider === "gemini" && (
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                        Google Gemini API Key
                      </label>
                      <Input
                        type={revealKeys ? "text" : "password"}
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="h-9 sm:h-8 rounded-none font-mono text-base sm:text-xs"
                      />
                    </div>
                  )}

                  {selectedProvider === "openrouter" && (
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                        OpenRouter API Key
                      </label>
                      <Input
                        type={revealKeys ? "text" : "password"}
                        value={openrouterKey}
                        onChange={(e) => setOpenrouterKey(e.target.value)}
                        placeholder="sk-or-v1-..."
                        className="h-9 sm:h-8 rounded-none font-mono text-base sm:text-xs"
                      />
                    </div>
                  )}

                  {selectedProvider === "groq" && (
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                        Groq API Key
                      </label>
                      <Input
                        type={revealKeys ? "text" : "password"}
                        value={groqKey}
                        onChange={(e) => setGroqKey(e.target.value)}
                        placeholder="gsk_..."
                        className="h-9 sm:h-8 rounded-none font-mono text-base sm:text-xs"
                      />
                    </div>
                  )}

                  {selectedProvider === "custom" && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                          Base URL (Ollama, vLLM, LM Studio)
                        </label>
                        <Input
                          type="text"
                          value={customBaseUrl}
                          onChange={(e) => setCustomBaseUrl(e.target.value)}
                          placeholder="http://localhost:11434/v1 or http://localhost:11434"
                          className="h-9 sm:h-8 rounded-none font-mono text-base sm:text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                          API Key (optional for local models)
                        </label>
                        <Input
                          type={revealKeys ? "text" : "password"}
                          value={customApiKey}
                          onChange={(e) => setCustomApiKey(e.target.value)}
                          placeholder="sk-..."
                          className="h-9 sm:h-8 rounded-none font-mono text-base sm:text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Common Model Identifier & Auto-Discovery Block */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between gap-2">
                      <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                        Model Identifier
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={fetchingModels}
                        onClick={() => handleFetchModels(selectedProvider)}
                        className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider gap-1"
                      >
                        <svg
                          className={cn("size-2.5", fetchingModels && "animate-spin")}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        <span>{fetchingModels ? "Fetching..." : "Fetch Models"}</span>
                      </Button>
                    </div>

                    <Input
                      type="text"
                      value={
                        selectedProvider === "custom"
                          ? (customModel || providerModels.custom || "")
                          : (providerModels[selectedProvider] || "")
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (selectedProvider === "custom") {
                          setCustomModel(val);
                        }
                        setProviderModels((prev) => ({ ...prev, [selectedProvider]: val }));
                      }}
                      placeholder={
                        selectedProvider === "deepseek"
                          ? "deepseek-chat"
                          : selectedProvider === "openai"
                          ? "gpt-4o"
                          : selectedProvider === "anthropic"
                          ? "claude-3-7-sonnet-20250219"
                          : selectedProvider === "gemini"
                          ? "gemini-2.0-flash"
                          : selectedProvider === "openrouter"
                          ? "deepseek/deepseek-r1"
                          : selectedProvider === "groq"
                          ? "llama-3.3-70b-versatile"
                          : "deepseek-r1 or qwen2.5-coder"
                      }
                      className="h-9 sm:h-8 rounded-none font-mono text-base sm:text-xs"
                    />

                    {/* Custom Themed ModelDropdownSelector */}
                    {availableModels[selectedProvider] && availableModels[selectedProvider].length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                          <span>Available Models ({availableModels[selectedProvider].length})</span>
                        </div>
                        <ModelDropdownSelector
                          models={availableModels[selectedProvider]}
                          selectedModel={
                            selectedProvider === "custom"
                              ? (customModel || providerModels.custom || "")
                              : (providerModels[selectedProvider] || "")
                          }
                          onSelect={(chosenModel) => {
                            if (selectedProvider === "custom") {
                              setCustomModel(chosenModel);
                            }
                            setProviderModels((prev) => ({ ...prev, [selectedProvider]: chosenModel }));
                          }}
                          placeholder={`Choose from ${availableModels[selectedProvider].length} discovered models...`}
                        />
                      </div>
                    )}

                    {modelFetchNotice && (
                      <p className="text-[11px] font-mono text-muted-foreground pt-0.5">
                        {modelFetchNotice}
                      </p>
                    )}
                  </div>
                </div>

                {/* Configured Status Summary */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40 text-[11px] font-mono text-muted-foreground">
                  <span className="text-[10px] uppercase tracking-wider">Configured:</span>
                  {providerRows
                    .filter((p) => p.configured)
                    .map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20"
                      >
                        <span className="size-1 rounded-full bg-emerald-500" />
                        {p.tabName}
                      </span>
                    ))}
                  {!isAnyConfigured && (
                    <span className="italic text-muted-foreground/60 text-[10px]">No keys configured yet</span>
                  )}
                </div>

                {lastAction === "keys" && actionOutput && (
                  <div className="space-y-1.5 border-border/50 border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                        Provider Key Sync Output
                      </span>
                      <button
                        className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => {
                          setActionOutput(null);
                          setLastAction(null);
                          setActionOk(null);
                        }}
                        type="button"
                      >
                        Clear ✕
                      </button>
                    </div>
                    <VerbatimOutput
                      label="Key Vault Mutation"
                      ok={actionOk ?? true}
                      output={actionOutput}
                      preClassName="min-h-[60px] max-h-[160px] p-2.5 text-[11px]"
                    />
                  </div>
                )}
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
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 p-2 sm:px-3 sm:py-2.5">
                    <span className="truncate font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
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
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 p-2 sm:px-3 sm:py-2.5">
                    <span className="truncate font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                      Configured
                    </span>
                    <span className="mt-1 truncate font-bold font-mono text-foreground text-xs">
                      {jsonTelemetry.configuredCount} / 7 PROVIDERS
                    </span>
                  </div>
                  <div className="flex flex-col justify-between border border-border/60 bg-muted/10 p-2 sm:px-3 sm:py-2.5">
                    <span className="truncate font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
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
                  className="h-[200px] resize-none rounded-none font-mono text-base sm:text-xs leading-relaxed"
                  disabled={loading}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder='{"api_providers": {"deepseek": {"api_key": "..."}}}'
                  spellCheck={false}
                  value={content}
                />

                {lastAction === "payload" && actionOutput && (
                  <div className="space-y-1.5 border-border/50 border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                        JSON Payload Output
                      </span>
                      <button
                        className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => {
                          setActionOutput(null);
                          setLastAction(null);
                          setActionOk(null);
                        }}
                        type="button"
                      >
                        Clear ✕
                      </button>
                    </div>
                    <VerbatimOutput
                      label="POST /api/dsh-settings"
                      ok={actionOk ?? true}
                      output={actionOutput}
                      preClassName="min-h-[60px] max-h-[160px] p-2.5 text-[11px]"
                    />
                  </div>
                )}
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

      {/* Row 2: Provider Key Fingerprint & Routing Matrix */}
      <CadGridFrame>
        <div className="relative w-full overflow-visible">
          <div className="grid w-full grid-cols-1 md:grid-cols-12">
            {/* [K-03] Provider Key Fingerprint & Routing Matrix */}
            <CadCell
              bodyClassName="flex flex-col justify-between gap-4 p-5"
              className="md:col-span-12"
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
                  const { id: provId, configured } = provider;
                  return (
                    <div
                      className="flex items-center justify-between gap-2 px-3 py-2"
                      key={provider.id}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span
                            className={cn(
                              "size-1.5 shrink-0 rounded-full",
                              configured ? "bg-emerald-500" : "bg-amber-500"
                            )}
                          />
                          <span className="font-bold font-mono text-foreground text-xs shrink-0">
                            {provider.name}
                          </span>
                          <span className="border border-border/60 bg-muted/20 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground truncate hidden xs:inline-block max-w-[120px] sm:max-w-none">
                            {provider.envVar}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                          Model: {provider.models}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center justify-end gap-2 text-right">
                        <div>
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
                        {configured ? (
                          <Button
                            aria-label={`Delete ${provider.name}`}
                            className="size-6 rounded-none border-destructive/40 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={loading}
                            onClick={() =>
                              handleDeleteProvider(provId, provider.name)
                            }
                            size="icon-sm"
                            title={`Delete ${provider.name}`}
                            type="button"
                            variant="outline"
                          >
                            <svg
                              aria-hidden="true"
                              className="size-3"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.75"
                              viewBox="0 0 24 24"
                            >
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              <line x1="10" x2="10" y1="11" y2="17" />
                              <line x1="14" x2="14" y1="11" y2="17" />
                            </svg>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {lastAction === "matrix" && actionOutput && (
                <div className="space-y-1.5 border-border/50 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                      Credential Deletion Output
                    </span>
                    <button
                      className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => {
                        setActionOutput(null);
                        setLastAction(null);
                        setActionOk(null);
                      }}
                      type="button"
                    >
                      Clear ✕
                    </button>
                  </div>
                  <VerbatimOutput
                    label="Key Vault Deletion"
                    ok={actionOk ?? true}
                    output={actionOutput}
                    preClassName="min-h-[60px] max-h-[160px] p-2.5 text-[11px]"
                  />
                </div>
              )}
            </CadCell>
          </div>

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
