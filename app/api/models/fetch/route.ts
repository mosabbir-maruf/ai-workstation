import { NextResponse } from "next/server";
import { proxyOrRespond } from "@/lib/workstation/server-state";

interface FetchRequestBody {
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
}

interface ModelItem {
  id?: string;
  name?: string;
  model?: string;
  supportedGenerationMethods?: string[];
}

const DEFAULT_MODELS: Record<string, string[]> = {
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
  openai: ["gpt-4o", "gpt-4o-mini", "o3-mini", "o1", "o1-mini", "gpt-4-turbo"],
  anthropic: [
    "claude-3-7-sonnet-20250219",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
    "claude-3-opus-20240229",
  ],
  gemini: ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-pro", "gemini-1.5-flash"],
  openrouter: [
    "deepseek/deepseek-r1",
    "deepseek/deepseek-chat",
    "anthropic/claude-3.7-sonnet",
    "openai/gpt-4o",
    "meta-llama/llama-3.3-70b-instruct",
  ],
  groq: [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "deepseek-r1-distill-llama-70b",
    "mixtral-8x7b-32768",
  ],
  custom: ["deepseek-r1", "qwen2.5-coder", "llama3.2"],
};

export async function POST(request: Request) {
  return await proxyOrRespond(request, "/api/models/fetch", async () => {
    let body: FetchRequestBody = {};
    try {
      body = (await request.clone().json()) as FetchRequestBody;
    } catch {
      // empty
    }

    const provider = body.provider || "custom";
    const apiKey = (body.apiKey || "").trim();
    const rawBaseUrl = (body.baseUrl || "").trim();
    let models: string[] = [];
    let fetchError: string | null = null;

    try {
      if (provider === "custom" || rawBaseUrl) {
        let normalized = rawBaseUrl.replace(/\/+$/, "");
        if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
          normalized = `http://${normalized}`;
        }

        const urlsToTry = [
          `${normalized}/models`,
          normalized.endsWith("/v1") ? `${normalized}/models` : `${normalized}/v1/models`,
          `${normalized.replace(/\/v1$/, "")}/api/tags`,
        ];

        const headers: Record<string, string> = { Accept: "application/json" };
        if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`;
        }

        for (const testUrl of urlsToTry) {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(testUrl, { headers, signal: controller.signal });
            clearTimeout(timer);

            if (res.ok) {
              const data = (await res.json()) as {
                data?: ModelItem[];
                models?: ModelItem[];
              };
              if (data && typeof data === "object") {
                if (Array.isArray(data.data)) {
                  const extracted = data.data
                    .map((m: ModelItem) => m?.id || m?.name)
                    .filter((m): m is string => Boolean(m));
                  if (extracted.length > 0) {
                    models = extracted;
                    break;
                  }
                } else if (Array.isArray(data.models)) {
                  const extracted = data.models
                    .map((m: ModelItem) => m?.name || m?.model)
                    .filter((m): m is string => Boolean(m));
                  if (extracted.length > 0) {
                    models = extracted;
                    break;
                  }
                }
              } else if (Array.isArray(data)) {
                const extracted = (data as unknown[])
                  .map((m: unknown) => {
                    if (typeof m === "string") return m;
                    if (m && typeof m === "object") {
                      const item = m as ModelItem;
                      return item.id || item.name || "";
                    }
                    return "";
                  })
                  .filter((m): m is string => Boolean(m));
                if (extracted.length > 0) {
                  models = extracted;
                  break;
                }
              }
            }
          } catch {
            continue;
          }
        }
      } else if (provider === "deepseek") {
        models = DEFAULT_MODELS.deepseek;
        if (apiKey) {
          try {
            const res = await fetch("https://api.deepseek.com/models", {
              headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
            });
            if (res.ok) {
              const data = (await res.json()) as { data?: ModelItem[] };
              if (Array.isArray(data?.data)) {
                const ids = data.data
                  .map((m: ModelItem) => m?.id)
                  .filter((m): m is string => Boolean(m));
                if (ids.length > 0) models = ids;
              }
            }
          } catch (e: unknown) {
            fetchError = e instanceof Error ? e.message : String(e);
          }
        }
      } else if (provider === "openai") {
        models = DEFAULT_MODELS.openai;
        if (apiKey) {
          try {
            const res = await fetch("https://api.openai.com/v1/models", {
              headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
            });
            if (res.ok) {
              const data = (await res.json()) as { data?: ModelItem[] };
              if (Array.isArray(data?.data)) {
                const all = data.data
                  .map((m: ModelItem) => m?.id)
                  .filter((m): m is string => Boolean(m));
                const chat = all.filter((id: string) => /^(gpt-4|gpt-3\.5|o1|o3|chatgpt)/.test(id));
                if (chat.length > 0) {
                  models = chat.sort((a: string, b: string) => {
                    const aScore = a.startsWith("gpt-4o") ? 0 : a.startsWith("o3") ? 1 : a.startsWith("o1") ? 2 : 3;
                    const bScore = b.startsWith("gpt-4o") ? 0 : b.startsWith("o3") ? 1 : b.startsWith("o1") ? 2 : 3;
                    return aScore - bScore || a.localeCompare(b);
                  });
                }
              }
            }
          } catch (e: unknown) {
            fetchError = e instanceof Error ? e.message : String(e);
          }
        }
      } else if (provider === "anthropic") {
        models = DEFAULT_MODELS.anthropic;
        if (apiKey) {
          try {
            const res = await fetch("https://api.anthropic.com/v1/models", {
              headers: {
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                Accept: "application/json",
              },
            });
            if (res.ok) {
              const data = (await res.json()) as { data?: ModelItem[] };
              if (Array.isArray(data?.data)) {
                const ids = data.data
                  .map((m: ModelItem) => m?.id)
                  .filter((m): m is string => Boolean(m));
                if (ids.length > 0) models = ids;
              }
            }
          } catch (e: unknown) {
            fetchError = e instanceof Error ? e.message : String(e);
          }
        }
      } else if (provider === "gemini") {
        models = DEFAULT_MODELS.gemini;
        if (apiKey) {
          try {
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
              { headers: { Accept: "application/json" } }
            );
            if (res.ok) {
              const data = (await res.json()) as { models?: ModelItem[] };
              if (Array.isArray(data?.models)) {
                const ids = data.models
                  .filter((m: ModelItem) => m?.supportedGenerationMethods?.includes("generateContent"))
                  .map((m: ModelItem) => (m?.name || "").replace(/^models\//, ""))
                  .filter((m): m is string => Boolean(m));
                if (ids.length > 0) models = ids;
              }
            }
          } catch (e: unknown) {
            fetchError = e instanceof Error ? e.message : String(e);
          }
        }
      } else if (provider === "openrouter") {
        models = DEFAULT_MODELS.openrouter;
        try {
          const headers: Record<string, string> = { Accept: "application/json" };
          if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
          const res = await fetch("https://openrouter.ai/api/v1/models", { headers });
          if (res.ok) {
            const data = (await res.json()) as { data?: ModelItem[] };
            if (Array.isArray(data?.data)) {
              const ids = data.data
                .map((m: ModelItem) => m?.id)
                .filter((m): m is string => Boolean(m));
              if (ids.length > 0) models = ids.slice(0, 50);
            }
          }
        } catch (e: unknown) {
          fetchError = e instanceof Error ? e.message : String(e);
        }
      } else if (provider === "groq") {
        models = DEFAULT_MODELS.groq;
        if (apiKey) {
          try {
            const res = await fetch("https://api.groq.com/openai/v1/models", {
              headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
            });
            if (res.ok) {
              const data = (await res.json()) as { data?: ModelItem[] };
              if (Array.isArray(data?.data)) {
                const ids = data.data
                  .map((m: ModelItem) => m?.id)
                  .filter((m): m is string => Boolean(m));
                if (ids.length > 0) models = ids;
              }
            }
          } catch (e: unknown) {
            fetchError = e instanceof Error ? e.message : String(e);
          }
        }
      }
    } catch (err: unknown) {
      fetchError = err instanceof Error ? err.message : String(err);
    }

    if (models.length === 0 && DEFAULT_MODELS[provider]) {
      models = DEFAULT_MODELS[provider];
    }

    return NextResponse.json({
      ok: models.length > 0,
      provider,
      models,
      error: models.length > 0 ? null : fetchError || "No models discovered.",
    });
  });
}
