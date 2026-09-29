import { type NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  getAuthSecret,
  timingSafeEqual,
  verifySession,
} from "@/lib/auth/session";
import { SITE_URL } from "@/lib/site-url";

const canonicalUrl = new URL(SITE_URL);
const CANONICAL_HOST = canonicalUrl.host.toLowerCase();

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requestHost = (
    request.headers.get("host") ?? request.nextUrl.host
  ).toLowerCase();

  // 1. Canonical domain enforcement for Vercel preview URLs
  if (
    process.env.VERCEL_ENV === "production" &&
    requestHost !== CANONICAL_HOST &&
    requestHost.endsWith(".vercel.app")
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.protocol = canonicalUrl.protocol;
    redirectUrl.host = canonicalUrl.host;
    redirectUrl.port = "";
    return NextResponse.redirect(redirectUrl, 308);
  }

  // Whitelist public API endpoints before running Web Crypto HMAC verification
  if (pathname.startsWith("/api/auth/") || pathname === "/api/search") {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const authSecret = getAuthSecret();

  // Verify cookie session using Web Crypto only when a session cookie is actually present
  const isSessionValid =
    sessionCookie && authSecret
      ? await verifySession(sessionCookie, authSecret)
      : false;

  // 2. Login Page Logic
  if (pathname === "/login") {
    if (isSessionValid) {
      const from = request.nextUrl.searchParams.get("from");
      const destination = from && from.startsWith("/") ? from : "/workstation";
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.next();
  }

  // 3. Protected API Routes
  if (pathname.startsWith("/api/")) {
    const authHeader = request.headers.get("authorization");
    let hasValidBearer = false;
    if (authHeader?.startsWith("Bearer ") && authSecret) {
      const bearerToken = authHeader.slice(7).trim();
      hasValidBearer = timingSafeEqual(bearerToken, authSecret);
    }

    if (!isSessionValid && !hasValidBearer) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized: Workstation authentication required.",
        },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  // 4. Protected Workstation Console
  if (pathname.startsWith("/workstation") && !isSessionValid) {
    const isPrefetch =
      request.headers.get("next-router-prefetch") === "1" ||
      request.headers.get("purpose") === "prefetch";
    if (isPrefetch) {
      return new NextResponse(null, { status: 204 });
    }

    const loginUrl = new URL("/login", request.url);
    const destination = pathname + search;
    if (destination !== "/workstation") {
      loginUrl.searchParams.set("from", destination);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/workstation/:path*", "/login", "/api/:path*"],
};
