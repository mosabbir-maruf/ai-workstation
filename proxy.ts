import { type NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  getAuthSecret,
  timingSafeEqual,
  verifySession,
} from "@/lib/auth/session";
import { SITE_URL } from "@/lib/site-url";

const canonicalUrl = new URL(SITE_URL);
const CANONICAL_HOST = canonicalUrl.host;

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requestHost = (
    request.headers.get("host") ?? request.nextUrl.host
  ).toLowerCase();
  const canonicalHost = CANONICAL_HOST.toLowerCase();

  // 1. Canonical domain enforcement for Vercel preview URLs
  if (
    process.env.VERCEL_ENV === "production" &&
    requestHost !== canonicalHost &&
    requestHost.endsWith(".vercel.app")
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.protocol = canonicalUrl.protocol;
    redirectUrl.host = CANONICAL_HOST;
    redirectUrl.port = "";
    return NextResponse.redirect(redirectUrl, 308);
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const authSecret = getAuthSecret();

  // Helper to verify cookie session using Web Crypto
  const isSessionValid = authSecret
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
    // Whitelist public API endpoints (documentation search & authentication routes)
    if (pathname.startsWith("/api/auth/") || pathname === "/api/search") {
      return NextResponse.next();
    }

    // Verify session cookie or Direct Bearer Token (for CLI tools / scripts)
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
  if (pathname.startsWith("/workstation")) {
    if (!isSessionValid) {
      const loginUrl = new URL("/login", request.url);
      const destination = pathname + search;
      if (destination !== "/workstation") {
        loginUrl.searchParams.set("from", destination);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  // 5. Standard Page Responses: Attach canonical Link header
  const response = NextResponse.next();
  const canonicalPageUrl = new URL(pathname, SITE_URL);
  response.headers.set("Link", `<${canonicalPageUrl.href}>; rel="canonical"`);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all requests except static assets:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Public asset extensions (.svg, .png, .jpg, .ico, .css, .js)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
