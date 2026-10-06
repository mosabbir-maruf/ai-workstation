/**
 * Zero-dependency, Web Crypto-based secure session manager for AIWS.
 * Employs HMAC-SHA256 signatures with constant-time equality checks.
 * Works natively in Node.js 18+, Next.js Edge Runtime, and V8 isolates.
 */

export const SESSION_COOKIE_NAME = "aiws_session";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

/** Resolves configured master auth secret with fallback chain */
export function getAuthSecret(): string {
  const secret =
    process.env.WORKSTATION_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    process.env.WORKSTATION_API_KEY ||
    "";
  return secret.trim();
}

/** Constant-time string equality check to prevent timing attacks */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Generates an HMAC-SHA256 hex digest for arbitrary input string using Web Crypto */
async function createHmacSha256(keyStr: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyStr);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(message)
  );

  const byteArray = new Uint8Array(signatureBuffer);
  let hex = "";
  for (let i = 0; i < byteArray.length; i++) {
    hex += byteArray[i].toString(16).padStart(2, "0");
  }
  return hex;
}

/** Creates a tamper-proof signed session token: `${timestamp}.${signature}` */
export async function signSession(secret?: string): Promise<string> {
  const resolvedSecret = secret ?? getAuthSecret();
  if (!resolvedSecret) {
    throw new Error("No authentication secret configured on the server.");
  }
  const timestamp = Date.now().toString();
  const signature = await createHmacSha256(
    resolvedSecret,
    `workstation-session:${timestamp}`
  );
  return `${timestamp}.${signature}`;
}

/**
 * Verifies that a session token was signed by the server's secret
 * and has not expired or been forged.
 */
export async function verifySession(
  token: string | null | undefined,
  secret?: string,
  maxAgeMs = SESSION_MAX_AGE_SECONDS * 1000
): Promise<boolean> {
  if (!token || typeof token !== "string") {
    return false;
  }

  const resolvedSecret = secret ?? getAuthSecret();
  if (!resolvedSecret) {
    // If no secret is configured, deny access by default for safety
    return false;
  }

  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) {
    return false;
  }

  const timestampStr = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);

  const timestamp = Number.parseInt(timestampStr, 10);
  if (Number.isNaN(timestamp) || timestamp <= 0) {
    return false;
  }

  const now = Date.now();
  // Reject future timestamps (> 60s clock skew) or expired timestamps
  if (timestamp > now + 60_000 || now - timestamp > maxAgeMs) {
    return false;
  }

  const expectedSignature = await createHmacSha256(
    resolvedSecret,
    `workstation-session:${timestampStr}`
  );

  return timingSafeEqual(signature, expectedSignature);
}
