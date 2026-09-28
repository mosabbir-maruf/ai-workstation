export interface WorkstationState {
  workstationStatus: "running" | "stopped" | "starting" | "offline";
  appStatus: "running" | "stopped" | "rebuilding";
  harnessStatus: "active" | "idle" | "stopped";
  dshVersion: string;
  githubConfigured: boolean;
  tunnelStatus: "online" | "offline" | "connecting";
  tunnelConfig: {
    token?: string;
    appHost?: string;
    dshHost?: string;
    appPort?: number;
  };
  projects: Array<{ name: string; active: boolean }>;
  dshSettings: {
    content: string;
    mtime: string;
  };
  cacheStats: {
    size: string;
    items: number;
    lastCleared: string;
  };
  gitInfo: {
    branch: string;
    lastCommitMessage: string;
    lastCommitTime: string;
    dirtyFilesCount: number;
  };
}

function getRuntimeEnv(key: string): string | undefined {
  const env = process.env as Record<string, string | undefined>;
  return env[key];
}

export function getBackendBaseUrl(): string {
  const url =
    getRuntimeEnv("WORKSTATION_BACKEND_URL") ||
    getRuntimeEnv("NEXT_PUBLIC_API_URL") ||
    getRuntimeEnv("API_URL");
  return url ? url.trim().replace(/\/+$/, "") : "";
}

export function createBackendErrorResponse(
  endpointPath: string,
  targetUrl?: string,
  errorDetail?: string
): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      output: `Backend service unavailable for ${endpointPath}.${
        targetUrl
          ? ` Failed connecting to ${targetUrl}.`
          : " No backend URL configured."
      } Ensure the ai-workstation daemon is running and NEXT_PUBLIC_API_URL or WORKSTATION_BACKEND_URL is set.${
        errorDetail ? ` Details: ${errorDetail}` : ""
      }`,
    }),
    {
      status: 503,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export async function proxyOrRespond(
  request: Request,
  endpointPath: string,
  fallbackFn?: () => Promise<Response> | Response
): Promise<Response> {
  const backendBase = getBackendBaseUrl();

  if (backendBase) {
    try {
      const targetUrl = new URL(endpointPath, backendBase);
      const headers = new Headers(request.headers);
      headers.set("host", targetUrl.host);

      // Support CORS forwarding
      const origin = request.headers.get("origin");
      if (origin) {
        headers.set("origin", origin);
      }

      // Inject server-side secret API Key / Bearer token if configured
      const apiKey = getRuntimeEnv("WORKSTATION_API_KEY");
      if (apiKey && !headers.has("authorization")) {
        headers.set("Authorization", `Bearer ${apiKey.trim()}`);
      }

      // Strip accept-encoding from forwarded request so upstream doesn't compress
      // or if it does, Node fetch handles decompression transparently
      headers.delete("accept-encoding");

      const fetchOptions: RequestInit = {
        method: request.method,
        headers,
      };

      if (request.method !== "GET" && request.method !== "HEAD") {
        const body = await request.clone().arrayBuffer();
        fetchOptions.body = body;
      }

      const res = await fetch(targetUrl.toString(), fetchOptions);

      // Pass response through with stripped hop-by-hop & compression headers
      const responseHeaders = new Headers(res.headers);
      if (origin) {
        responseHeaders.set("Access-Control-Allow-Origin", origin);
        responseHeaders.set(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, DELETE, OPTIONS"
        );
        responseHeaders.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization"
        );
      }

      // Node fetch() automatically decodes gzip/br/deflate response bodies.
      // Forwarding upstream's Content-Encoding or Content-Length headers causes
      // the browser to throw net::ERR_CONTENT_DECODING_FAILED 200 (OK) because
      // the browser attempts to decompress an already uncompressed payload.
      responseHeaders.delete("content-encoding");
      responseHeaders.delete("content-length");
      responseHeaders.delete("transfer-encoding");
      responseHeaders.delete("connection");
      responseHeaders.delete("keep-alive");

      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
      });
    } catch (err) {
      if (fallbackFn) {
        return await fallbackFn();
      }
      return createBackendErrorResponse(
        endpointPath,
        backendBase,
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  if (fallbackFn) {
    return await fallbackFn();
  }

  return createBackendErrorResponse(endpointPath);
}

/** Helper to generate realistic SSE stream with 'event: end' terminal */
export function createUnavailableSseStream(endpointPath: string): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const timestamp = new Date().toISOString().slice(11, 19);
      controller.enqueue(
        encoder.encode(
          `event: message\ndata: [${timestamp}] [ERROR] Backend stream unavailable for ${endpointPath}. Ensure ai-workstation is running and NEXT_PUBLIC_API_URL is configured.\n\n`
        )
      );
      controller.enqueue(
        encoder.encode("event: end\ndata: [STREAM_COMPLETED]\n\n")
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
