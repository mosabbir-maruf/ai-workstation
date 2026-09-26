"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface SseStreamState {
  logs: string[];
  connected: boolean;
  isEnded: boolean;
}

type SseListener = (state: SseStreamState) => void;

interface ActiveStream {
  eventSource: EventSource | null;
  logs: string[];
  connected: boolean;
  isEnded: boolean;
  listeners: Set<SseListener>;
  errorCount: number;
  maxBuffer: number;
}

const activeStreams = new Map<string, ActiveStream>();

function notifyListeners(stream: ActiveStream) {
  const snapshot: SseStreamState = {
    logs: [...stream.logs],
    connected: stream.connected,
    isEnded: stream.isEnded,
  };
  for (const listener of stream.listeners) {
    listener(snapshot);
  }
}

function resolveSseUrl(endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && typeof envUrl === "string") {
    const base = envUrl.trim().replace(/\/+$/, "");
    return `${base}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  }
  return endpoint;
}

function openStream(endpoint: string, stream: ActiveStream) {
  if (typeof window === "undefined") {
    return;
  }
  if (stream.eventSource) {
    return;
  }

  stream.isEnded = false;
  stream.connected = false;

  try {
    const targetUrl = resolveSseUrl(endpoint);
    const es = new EventSource(targetUrl);
    stream.eventSource = es;

    es.onopen = () => {
      stream.connected = true;
      stream.errorCount = 0;
      notifyListeners(stream);
    };

    es.onmessage = (event) => {
      if (!event.data) {
        return;
      }
      stream.logs.push(event.data);
      if (stream.logs.length > stream.maxBuffer) {
        stream.logs = stream.logs.slice(stream.logs.length - stream.maxBuffer);
      }
      notifyListeners(stream);
    };

    es.addEventListener("end", () => {
      stream.isEnded = true;
      stream.connected = false;
      if (stream.eventSource) {
        stream.eventSource.close();
        stream.eventSource = null;
      }
      notifyListeners(stream);
    });

    es.onerror = () => {
      stream.connected = false;
      stream.errorCount += 1;
      // Close after persistent errors to prevent infinite browser retry storms
      if (stream.errorCount > 5 && stream.eventSource) {
        stream.eventSource.close();
        stream.eventSource = null;
      }
      notifyListeners(stream);
    };
  } catch {
    stream.connected = false;
    notifyListeners(stream);
  }
}

function closeStream(_endpoint: string, stream: ActiveStream) {
  if (stream.eventSource) {
    stream.eventSource.close();
    stream.eventSource = null;
  }
  stream.connected = false;
  notifyListeners(stream);
}

export function subscribeToSse(
  endpoint: string,
  listener: SseListener,
  maxBuffer = 2500
): () => void {
  let stream = activeStreams.get(endpoint);
  if (stream) {
    stream.maxBuffer = Math.max(stream.maxBuffer, maxBuffer);
  } else {
    stream = {
      eventSource: null,
      logs: [],
      connected: false,
      isEnded: false,
      listeners: new Set(),
      errorCount: 0,
      maxBuffer,
    };
    activeStreams.set(endpoint, stream);
  }

  stream.listeners.add(listener);
  // Send current cached logs to the new subscriber immediately
  listener({
    logs: [...stream.logs],
    connected: stream.connected,
    isEnded: stream.isEnded,
  });

  if (!(stream.eventSource || stream.isEnded)) {
    openStream(endpoint, stream);
  }

  return () => {
    const existing = activeStreams.get(endpoint);
    if (!existing) {
      return;
    }
    existing.listeners.delete(listener);
    if (existing.listeners.size === 0) {
      closeStream(endpoint, existing);
      activeStreams.delete(endpoint);
    }
  };
}

export function restartSseStream(endpoint: string) {
  const stream = activeStreams.get(endpoint);
  if (!stream) {
    return;
  }
  closeStream(endpoint, stream);
  stream.logs = [];
  stream.isEnded = false;
  openStream(endpoint, stream);
}

export function clearSseLogs(endpoint: string) {
  const stream = activeStreams.get(endpoint);
  if (stream) {
    stream.logs = [];
    notifyListeners(stream);
  }
}

export function useSseStream(
  endpoint: string,
  options?: {
    autoConnect?: boolean;
    maxLines?: number;
  }
) {
  const autoConnect = options?.autoConnect ?? true;
  const maxLines = options?.maxLines ?? 1000;

  const [state, setState] = useState<SseStreamState>(() => {
    const existing = activeStreams.get(endpoint);
    if (existing) {
      const sliced = existing.logs.slice(
        Math.max(0, existing.logs.length - maxLines)
      );
      return {
        logs: sliced,
        connected: existing.connected,
        isEnded: existing.isEnded,
      };
    }
    return { logs: [], connected: false, isEnded: false };
  });

  const maxLinesRef = useRef(maxLines);
  maxLinesRef.current = maxLines;

  useEffect(() => {
    if (!autoConnect) {
      return;
    }

    const unsubscribe = subscribeToSse(
      endpoint,
      (incoming) => {
        const limit = maxLinesRef.current;
        const sliced =
          incoming.logs.length > limit
            ? incoming.logs.slice(incoming.logs.length - limit)
            : incoming.logs;

        setState({
          logs: sliced,
          connected: incoming.connected,
          isEnded: incoming.isEnded,
        });
      },
      maxLines
    );

    return () => {
      unsubscribe();
    };
  }, [endpoint, autoConnect, maxLines]);

  const startStream = useCallback(() => {
    restartSseStream(endpoint);
  }, [endpoint]);

  const stopStream = useCallback(() => {
    const stream = activeStreams.get(endpoint);
    if (stream) {
      closeStream(endpoint, stream);
    }
  }, [endpoint]);

  const clearLogs = useCallback(() => {
    clearSseLogs(endpoint);
    setState((prev) => ({ ...prev, logs: [] }));
  }, [endpoint]);

  return {
    logs: state.logs,
    connected: state.connected,
    isEnded: state.isEnded,
    startStream,
    stopStream,
    clearLogs,
  };
}
