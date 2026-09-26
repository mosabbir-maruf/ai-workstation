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

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

/** Resolves configured API base URL (NEXT_PUBLIC_API_URL), normalized without trailing slash */
export function getApiBaseUrl(): string {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) {
    const raw = process.env.NEXT_PUBLIC_API_URL;
    if (typeof raw === "string" && raw.trim().length > 0) {
      return raw.trim().replace(/\/+$/, "");
    }
  }
  return "";
}

/** Robust, typed request executor that handles HTTP errors, network timeouts, and structured errors */
async function requestJson<T extends { ok?: boolean; output?: string }>(
  endpointPath: string,
  options?: RequestOptions
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = endpointPath.startsWith("/")
    ? endpointPath
    : `/${endpointPath}`;
  const targetUrl = `${baseUrl}${normalizedPath}`;

  const timeoutMs = options?.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(targetUrl, {
      ...options,
      signal: options?.signal || controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
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

export const workstationApi = {
  // Health & Status
  getHealth: () => requestJson<HealthResponse>("/api/health"),
  getStatus: () => requestJson<StatusResponse>("/api/status"),
  startWorkstation: () =>
    requestJson<StandardOutputResponse>("/api/workstation/start", {
      method: "POST",
    }),
  stopWorkstation: () =>
    requestJson<StandardOutputResponse>("/api/workstation/stop", {
      method: "POST",
    }),
  restartWorkstation: () =>
    requestJson<StandardOutputResponse>("/api/workstation/restart", {
      method: "POST",
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
    }),
  appStop: () =>
    requestJson<StandardOutputResponse>("/api/app/stop", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  appRestart: () =>
    requestJson<StandardOutputResponse>("/api/app/restart", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  getAppStatus: () => requestJson<StandardOutputResponse>("/api/app/status"),

  // Harness & DSH
  harnessStart: () =>
    requestJson<StandardOutputResponse>("/api/harness/start", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  harnessStop: () =>
    requestJson<StandardOutputResponse>("/api/harness/stop", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  harnessRestart: () =>
    requestJson<StandardOutputResponse>("/api/harness/restart", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  getHarnessStatus: () =>
    requestJson<StandardOutputResponse>("/api/harness/status"),
  getDshVersion: () => requestJson<StandardOutputResponse>("/api/dsh/version"),
  updateDsh: (version?: string) =>
    requestJson<StandardOutputResponse>("/api/dsh/update", {
      method: "POST",
      body: JSON.stringify(version ? { version } : {}),
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
    const targetUrl = `${baseUrl}/api/state/import`;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(targetUrl, {
        method: "POST",
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

  // DSH Settings / Model Keys
  getDshSettings: () => requestJson<DshSettingsResponse>("/api/dsh-settings"),
  saveDshSettings: (content: string) =>
    requestJson<StandardOutputResponse>("/api/dsh-settings", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
};
