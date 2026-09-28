import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  getAuthSecret,
  signSession,
  timingSafeEqual,
} from "@/lib/auth/session";

interface AttemptRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding rate limit: max 5 failed attempts per IP per 60 seconds
const attemptsByIp = new Map<string, AttemptRecord>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = attemptsByIp.get(ip);
  if (!record || now > record.resetAt) {
    return true;
  }
  return record.count < RATE_LIMIT_MAX;
}

function recordFailedAttempt(ip: string): number {
  const now = Date.now();
  const record = attemptsByIp.get(ip);
  if (!record || now > record.resetAt) {
    attemptsByIp.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return 1;
  }
  record.count += 1;
  return record.count;
}

function clearRateLimit(ip: string): void {
  attemptsByIp.delete(ip);
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many failed authentication attempts. Please wait 60 seconds.",
      },
      { status: 429 }
    );
  }

  let body: { password?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request payload." },
      { status: 400 }
    );
  }

  const submittedPassword = typeof body.password === "string" ? body.password.trim() : "";
  const masterSecret = getAuthSecret();

  if (!masterSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: "Server authentication is not configured. Set WORKSTATION_PASSWORD in .env.",
      },
      { status: 500 }
    );
  }

  // Constant-time comparison
  const isValid = timingSafeEqual(submittedPassword, masterSecret);

  if (!isValid) {
    const attempts = recordFailedAttempt(ip);
    const remaining = Math.max(0, RATE_LIMIT_MAX - attempts);
    return NextResponse.json(
      {
        ok: false,
        error: remaining > 0
          ? `Invalid password. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Invalid password. Account temporarily locked for 60 seconds.",
      },
      { status: 401 }
    );
  }

  // Password matches — clear rate limit for this IP
  clearRateLimit(ip);

  // Generate cryptographic session token
  const token = await signSession(masterSecret);

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
