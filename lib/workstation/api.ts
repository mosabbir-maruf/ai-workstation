import { pauseAllSseStreams, resumeAllSseStreams } from "./sse-client";

export interface StandardOutputResponse {
  ok: boolean;
  output: string;
}

export interface WorkstationTelemetryMetrics {
  memory: {
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    usedPercent: number;
    totalFormatted: string;
    usedFormatted: string;
    pie: Array<{ label: string; value: number }>;
  };
  cpu: {
    cores: number;
    model: string;
    loadAvg: [number, number, number];
    usagePercent: number;
  };
  daemons: {
    totalCount: number;
    activeCount: number;
    rings: Array<{ label: string; value: number; maxValue: number }>;
  };
  throughput: Array<{
    month: string;
    ingress: number;
    egress: number;
    buffered: number;
  }>;
  timeline: Array<{
    date: string | Date;
    cpu: number;
    memory: number;
  }>;
  uptime: string;
  hostname: string;
  platform: string;
}

export interface StatusResponse {
  ok: boolean;
  output: string;
  metrics?: WorkstationTelemetryMetrics;
}

export interface HealthResponse {
  ok: boolean;
}

export interface ActiveProjectGitInfo {
  name: string;
  branch: string;
  lastCommitMessage: string;
  lastCommitTime: string;
  dirtyFilesCount: number;
}

export interface GitFileChange {
  status: string;
  path: string;
}

export interface GitDiffResponse {
  ok: boolean;
  clean: boolean;
  project?: string;
  path?: string;
  filesCount: number;
  files: GitFileChange[];
  stat: string;
  diff: string;
  output: string;
}

export interface OverviewResponse {
  ok: boolean;
  health: boolean;
  workstation: {
    running: boolean;
    status: string;
  };
  app: {
    running: boolean;
    pid: string;
  };
  harness: {
    active: boolean;
  };
  broker: {
    online: boolean;
  };
  tunnel: {
    online: boolean;
  };
  activeProject?: ActiveProjectGitInfo | null;
  preview: {
    anywhereApp: string;
    anywhereDsh: string;
  };
  metrics?: WorkstationTelemetryMetrics;
}

export interface ProjectsResponse {
  ok: boolean;
  projects: Array<{ name: string; active: boolean }>;
  raw: string;
  output?: string;
  activeProject?: ActiveProjectGitInfo;
}

export interface PreviewResponse {
  ok: boolean;
  text: string;
  anywhereApp: string;
  anywhereDsh: string;
}

export interface StateExportResponse {
  ok: boolean;
  filename: string;
  downloadUrl: string;
}

export interface DshSettingsResponse {
  ok: boolean;
  content: string;
  mtime: string;
}

export interface FetchModelsResponse {
  ok: boolean;
  provider: string;
  models: string[];
  error?: string | null;
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

function getServerEnv(key: string): string | undefined {
  if (typeof window !== "undefined" || typeof process === "undefined") {
    return undefined;
  }
  const env = process.env as Record<string, string | undefined>;
  return env[key];
}

/** Resolves API base URL: same-origin ("") in the browser so Next.js /api proxy routes handle authentication server-side without exposing secrets in client bundles */
export function getApiBaseUrl(): string {
  const raw =
    getServerEnv("WORKSTATION_BACKEND_URL") ||
    getServerEnv("NEXT_PUBLIC_API_URL");
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.trim().replace(/\/+$/, "");
  }
  return "";
}

export function getWorkstationApiKey(): string {
  const key = getServerEnv("WORKSTATION_API_KEY");
  if (typeof key === "string" && key.trim().length > 0) {
    return key.trim();
  }
  return "";
}

/** Robust, typed request executor that handles HTTP errors, network timeouts, and structured errors */
async function executeSingleRequest<T extends { ok?: boolean; output?: string }>(
  endpointPath: string,
  options?: RequestOptions
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const apiKey = getWorkstationApiKey();
  const normalizedPath = endpointPath.startsWith("/")
    ? endpointPath
    : `/${endpointPath}`;
  const targetUrl = `${baseUrl}${normalizedPath}`;

  const timeoutMs = options?.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const authHeaders: Record<string, string> = {};
  if (apiKey) {
    authHeaders["Authorization"] = `Bearer ${apiKey}`;
  }

  try {
    const res = await fetch(targetUrl, {
      ...options,
      signal: options?.signal || controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authHeaders,
        ...(options?.headers || {}),
      },
    });

    const text = await res.text();
    let data: T;
    try {
      data = text ? (JSON.parse(text) as T) : ({} as T);
    } catch {
      return {
        ok: false,
        output:
          text ||
          `HTTP ${res.status}: ${res.statusText} (Malformed response received from backend)`,
      } as unknown as T;
    }

    if (!res.ok) {
      if (data && typeof data === "object" && "output" in data && data.output) {
        return {
          ...data,
          ok: false,
        };
      }
      return {
        ok: false,
        output: `HTTP ${res.status} (${res.statusText}): Backend service request to ${normalizedPath} failed`,
        ...data,
      } as unknown as T;
    }

    return data;
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    const errorMessage = isAbort
      ? `Request timeout after ${timeoutMs}ms. Backend at ${baseUrl || "local API"} did not respond.`
      : `Network error: Unable to connect to backend at ${baseUrl || "current host"}. ${err instanceof Error ? err.message : String(err)}`;

    return {
      ok: false,
      output: errorMessage,
    } as unknown as T;
  } finally {
    clearTimeout(timer);
  }
}

function isResourceUnavailableError(output?: string): boolean {
  if (!output) return false;
  return (
    output.includes("Errno 11") ||
    output.includes("Resource temporarily unavailable")
  );
}

async function requestJson<T extends { ok?: boolean; output?: string }>(
  endpointPath: string,
  options?: RequestOptions
): Promise<T> {
  let result = await executeSingleRequest<T>(endpointPath, options);
  if (!isResourceUnavailableError(result?.output)) {
    return result;
  }

  // Lazy EAGAIN ([Errno 11] Resource temporarily unavailable) recovery:
  // Only pause SSE streams when EAGAIN actually occurs (zero overhead on normal requests).
  pauseAllSseStreams();
  try {
    for (let attempt = 1; attempt <= 2; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
      result = await executeSingleRequest<T>(endpointPath, options);
      if (!isResourceUnavailableError(result?.output)) {
        break;
      }
    }
  } finally {
    resumeAllSseStreams();
  }
  return result;
}

export const workstationApi = {
  // Health & Status
  getHealth: () => requestJson<HealthResponse>("/api/health"),
  getOverview: () =>
    requestJson<OverviewResponse>("/api/overview", { timeoutMs: 25000 }),
  getStatus: () =>
    requestJson<StatusResponse>("/api/status", { timeoutMs: 25000 }),
  startWorkstation: () =>
    requestJson<StandardOutputResponse>("/api/workstation/start", {
      method: "POST",
      timeoutMs: 300000,
    }),
  stopWorkstation: () =>
    requestJson<StandardOutputResponse>("/api/workstation/stop", {
      method: "POST",
      timeoutMs: 60000,
    }),
  restartWorkstation: () =>
    requestJson<StandardOutputResponse>("/api/workstation/restart", {
      method: "POST",
      timeoutMs: 300000,
    }),

  // Projects
  getProjects: () => requestJson<ProjectsResponse>("/api/projects"),
  activateProject: (name: string) =>
    requestJson<StandardOutputResponse>("/api/projects/use", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  addProject: (url: string) =>
    requestJson<StandardOutputResponse>("/api/projects/add", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),
  removeProject: (name: string) =>
    requestJson<StandardOutputResponse>("/api/projects/remove", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  // Git
  gitDiff: () => requestJson<GitDiffResponse>("/api/git/diff"),
  gitPull: () =>
    requestJson<StandardOutputResponse>("/api/git/pull", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  gitPush: (message: string) =>
    requestJson<StandardOutputResponse>("/api/git/push", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  // App Runtime
  appRun: () =>
    requestJson<StandardOutputResponse>("/api/app/run", {
      method: "POST",
      body: JSON.stringify({}),
      timeoutMs: 180000,
    }),
  appStop: () =>
    requestJson<StandardOutputResponse>("/api/app/stop", {
      method: "POST",
      body: JSON.stringify({}),
      timeoutMs: 30000,
    }),
  appRestart: () =>
    requestJson<StandardOutputResponse>("/api/app/restart", {
      method: "POST",
      body: JSON.stringify({}),
      timeoutMs: 180000,
    }),
  getAppStatus: () => requestJson<StandardOutputResponse>("/api/app/status"),

  // Harness & DSH
  harnessStart: () =>
    requestJson<StandardOutputResponse>("/api/harness/start", {
      method: "POST",
      body: JSON.stringify({}),
      timeoutMs: 60000,
    }),
  harnessStop: () =>
    requestJson<StandardOutputResponse>("/api/harness/stop", {
      method: "POST",
      body: JSON.stringify({}),
      timeoutMs: 30000,
    }),
  harnessRestart: () =>
    requestJson<StandardOutputResponse>("/api/harness/restart", {
      method: "POST",
      body: JSON.stringify({}),
      timeoutMs: 60000,
    }),
  getHarnessStatus: () =>
    requestJson<StandardOutputResponse>("/api/harness/status"),
  getDshVersion: () => requestJson<StandardOutputResponse>("/api/dsh/version"),
  updateDsh: (version?: string) =>
    requestJson<StandardOutputResponse>("/api/dsh/update", {
      method: "POST",
      body: JSON.stringify(version ? { version } : {}),
      timeoutMs: 180000,
    }),

  // Preview
  getPreview: () => requestJson<PreviewResponse>("/api/preview"),

  // GitHub Integration
  getGithubStatus: () =>
    requestJson<StandardOutputResponse>("/api/github/status"),
  setupGithub: (appId: string, installationId: string, pemText: string) =>
    requestJson<StandardOutputResponse>("/api/github/setup", {
      method: "POST",
      body: JSON.stringify({ appId, installationId, pemText }),
    }),
  testGithub: () =>
    requestJson<StandardOutputResponse>("/api/github/test", {
      method: "POST",
      body: JSON.stringify({}),
    }),

  // Cloudflare Tunnel
  getTunnelStatus: () =>
    requestJson<StandardOutputResponse>("/api/tunnel/status"),
  setupTunnel: (params: {
    token?: string;
    appHost?: string;
    dshHost?: string;
    appPort?: number;
  }) =>
    requestJson<StandardOutputResponse>("/api/tunnel/setup", {
      method: "POST",
      body: JSON.stringify(params),
    }),
  syncTunnel: (port?: number) =>
    requestJson<StandardOutputResponse>("/api/tunnel/sync", {
      method: "POST",
      body: JSON.stringify(port === undefined ? {} : { port }),
    }),
  startTunnel: () =>
    requestJson<StandardOutputResponse>("/api/tunnel/start", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  stopTunnel: () =>
    requestJson<StandardOutputResponse>("/api/tunnel/stop", {
      method: "POST",
      body: JSON.stringify({}),
    }),

  // Maintenance & System
  getCache: () => requestJson<StandardOutputResponse>("/api/cache"),
  clearCache: (
    options:
      | boolean
      | {
          deps?: boolean;
          docker?: boolean;
          logs?: boolean;
          temp?: boolean;
        }
  ) =>
    requestJson<StandardOutputResponse>("/api/cache/clear", {
      method: "POST",
      body: JSON.stringify(
        typeof options === "boolean" ? { deps: options } : options
      ),
    }),
  systemUpdate: () =>
    requestJson<StandardOutputResponse>("/api/system/update", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  systemUpgrade: () =>
    requestJson<StandardOutputResponse>("/api/system/upgrade", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  systemDoctor: () =>
    requestJson<StandardOutputResponse>("/api/system/doctor", {
      method: "POST",
      body: JSON.stringify({}),
    }),

  // State Management
  exportState: () =>
    requestJson<StateExportResponse>("/api/state/export", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  importState: async (file: File): Promise<StandardOutputResponse> => {
    const baseUrl = getApiBaseUrl();
    const apiKey = getWorkstationApiKey();
    const targetUrl = `${baseUrl}/api/state/import`;
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    try {
      const res = await fetch(targetUrl, {
        method: "POST",
        headers,
        body: formData,
      });
      const text = await res.text();
      try {
        const data = text ? JSON.parse(text) : {};
        return {
          ok: res.ok && (data.ok ?? true),
          output:
            data.output ||
            (res.ok
              ? "State imported successfully"
              : `HTTP ${res.status}: ${res.statusText}`),
        };
      } catch {
        return {
          ok: res.ok,
          output: text || `HTTP ${res.status}: ${res.statusText}`,
        };
      }
    } catch (err) {
      return {
        ok: false,
        output: `Network error: Unable to upload state archive. ${
          err instanceof Error ? err.message : String(err)
        }`,
      };
    }
  },

  // Terminal Execution
  executeTerminalCommand: (params: {
    command: string;
    target?: "host" | "workstation";
    sudoPassword?: string;
  }) =>
    requestJson<StandardOutputResponse & { requiresSudo?: boolean }>("/api/terminal/exec", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  // DSH Settings / Model Keys
  getDshSettings: () => requestJson<DshSettingsResponse>("/api/dsh-settings"),
  saveDshSettings: (content: string) =>
    requestJson<StandardOutputResponse>("/api/dsh-settings", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  // Model Auto-Discovery
  fetchAvailableModels: (params: {
    provider: string;
    apiKey?: string;
    baseUrl?: string;
  }) =>
    requestJson<FetchModelsResponse>("/api/models/fetch", {
      method: "POST",
      body: JSON.stringify(params),
    }),
};
