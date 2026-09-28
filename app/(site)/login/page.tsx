"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";
import { HomeFooter } from "@/components/design/home-footer";
import { Button } from "@/components/ui/button";
import { CadCell, CadGridFrame } from "@/components/workstation/cad-primitives";

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      {...props}
    >
      <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");
  const destination = fromParam && fromParam.startsWith("/") ? fromParam : "/workstation";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter the workstation master secret.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Authentication failed. Access denied.");
        setLoading(false);
        return;
      }

      // Success: redirect to target destination
      router.push(destination);
      router.refresh();
    } catch {
      setError("Network or connection error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <CadGridFrame showRulers>
      <CadCell
        footerLeft="SECURE OPERATOR ACCESS // 30-DAY ENCRYPTED SESSION"
        footerRight="STATUS: LOCKED"
        index="AUTH-01"
        title="Workstation Security Gateway"
      >
        <form className="flex flex-col gap-5 p-1 sm:p-2" onSubmit={handleSubmit}>
          <div className="flex items-start gap-3 border border-border/80 bg-muted/20 p-3.5 text-xs">
            <LockIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="font-mono text-muted-foreground leading-relaxed">
              This console provides remote control access to active container
              workspaces, daemon processes, and terminal execution. Enter the
              workstation master password to authenticate.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider"
              htmlFor="auth-password"
            >
              Operator Passphrase / Key
            </label>
            <div className="relative flex items-center">
              <input
                autoComplete="current-password"
                autoFocus
                className="h-10 w-full border border-border bg-muted/20 pr-10 pl-3 font-mono text-foreground text-xs placeholder:text-muted-foreground focus:border-foreground/40 focus:bg-background focus:outline-none"
                disabled={loading}
                id="auth-password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter WORKSTATION_PASSWORD..."
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                className="absolute right-2.5 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                type="button"
              >
                {showPassword ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="border border-destructive/40 bg-destructive/10 p-3 font-mono text-destructive text-xs">
              [ACCESS_DENIED]: {error}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              className="h-10 rounded-none px-6 font-mono text-xs uppercase tracking-wider"
              disabled={loading}
              type="submit"
              variant="white"
            >
              {loading ? "Authenticating..." : "Authorize & Unlock"}
            </Button>

            <Link
              className="font-mono text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              href="/docs/security"
            >
              Security Policy & Token Details →
            </Link>
          </div>
        </form>
      </CadCell>
    </CadGridFrame>
  );
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col space-y-10 overflow-x-clip pb-16 md:space-y-12 md:pb-24">
      <section className="relative w-full pt-8 sm:pt-16">
        <div className="container mx-auto max-w-xl overflow-visible px-[17px] sm:px-10">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-2 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
              AI Workstation Control Plane
            </div>
            <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
              Operator Authorization
            </h1>
          </div>

          <Suspense fallback={<div className="h-64 animate-pulse bg-muted/20" />}>
            <LoginForm />
          </Suspense>
        </div>
      </section>

      <HomeFooter />
    </main>
  );
}
