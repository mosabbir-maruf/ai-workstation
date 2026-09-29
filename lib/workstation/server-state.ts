const TEXT_ENCODER = new TextEncoder();

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

const activeUpstreamSseControllers = new Map<string, AbortController>();

const SSE_ENDPOINT_PATHS = new Set([
  "/api/logs/app",
  "/api/logs/workstation",
  "/api/tunnel/logs",
]);

export async function proxyOrRespond(
  request: Request,
  endpointPath: string,
  fallbackFn?: () => Promise<Response> | Response
): Promise<Response> {
  const backendBase = getBackendBaseUrl();

  if (backendBase) {
    const isSseEndpoint = SSE_ENDPOINT_PATHS.has(endpointPath);
    if (isSseEndpoint) {
      activeUpstreamSseControllers.get(endpointPath)?.abort();
    }

    const upstreamController = new AbortController();
    if (isSseEndpoint) {
      activeUpstreamSseControllers.set(endpointPath, upstreamController);
    }

    const onClientAbort = () => {
      upstreamController.abort();
      if (
        isSseEndpoint &&
        activeUpstreamSseControllers.get(endpointPath) === upstreamController
      ) {
        activeUpstreamSseControllers.delete(endpointPath);
      }
    };

    if (request.signal.aborted) {
      onClientAbort();
      return new Response(null, { status: 499 });
    }
    request.signal.addEventListener("abort", onClientAbort, { once: true });

    try {
      const targetUrl = new URL(endpointPath, backendBase);
      const headers = new Headers(request.headers);
      headers.set("host", targetUrl.host);

      const origin = request.headers.get("origin");
      if (origin) {
        headers.set("origin", origin);
      }

      const apiKey = getRuntimeEnv("WORKSTATION_API_KEY");
      if (apiKey && !headers.has("authorization")) {
        headers.set("Authorization", `Bearer ${apiKey.trim()}`);
      }

      headers.delete("accept-encoding");

      const fetchOptions: RequestInit = {
        method: request.method,
        headers,
        signal: upstreamController.signal,
      };

      if (request.method !== "GET" && request.method !== "HEAD") {
        const body = await request.clone().arrayBuffer();
        headers.set("content-length", String(body.byteLength));
        if (body.byteLength > 0) {
          fetchOptions.body = body;
        }
      }

      const res = await fetch(targetUrl.toString(), fetchOptions);

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
      if (
        isSseEndpoint &&
        activeUpstreamSseControllers.get(endpointPath) === upstreamController
      ) {
        activeUpstreamSseControllers.delete(endpointPath);
      }
      if (request.signal.aborted) {
        return new Response(null, { status: 499 });
      }
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
  const stream = new ReadableStream({
    start(controller) {
      const timestamp = new Date().toISOString().slice(11, 19);
      controller.enqueue(
        TEXT_ENCODER.encode(
          `event: message\ndata: [${timestamp}] [ERROR] Backend stream unavailable for ${endpointPath}. Ensure ai-workstation is running and NEXT_PUBLIC_API_URL is configured.\n\n`
        )
      );
      controller.enqueue(
        TEXT_ENCODER.encode("event: end\ndata: [STREAM_COMPLETED]\n\n")
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
