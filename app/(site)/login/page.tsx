"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";
import { AiwsLogo } from "@/components/icons/aiws-logo";
import { Button } from "@/components/ui/button";
import { CadCell, CadGridFrame } from "@/components/workstation/cad-primitives";

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
  const destination =
    fromParam && fromParam.startsWith("/") ? fromParam : "/workstation";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter your passphrase.");
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
        setError(data.error || "Access denied. Invalid passphrase.");
        setLoading(false);
        return;
      }

      router.push(destination);
      router.refresh();
    } catch {
      setError("Unable to reach server. Please try again.");
      setLoading(false);
    }
  };

  return (
    <CadGridFrame showRulers>
      <CadCell
        footerLeft="AUTHENTICATED SESSION // 30 DAYS"
        footerRight="STATUS: LOCKED"
        index="AUTH"
        title="Security Gateway"
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label
              className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest"
              htmlFor="auth-password"
            >
              Passphrase
            </label>
            <div className="relative flex items-center">
              <input
                autoComplete="current-password"
                autoFocus
                className="h-10 w-full border border-border bg-muted/20 pr-10 pl-3 font-mono text-foreground text-xs placeholder:text-muted-foreground focus:border-foreground/50 focus:bg-background focus:outline-none"
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
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2.5 text-muted-foreground transition-colors hover:text-foreground"
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
            <div className="border border-destructive/40 bg-destructive/10 px-3 py-2 font-mono text-[11px] text-destructive">
              {error}
            </div>
          )}

          <Button
            className="h-10 w-full rounded-none font-mono text-xs uppercase tracking-wider"
            disabled={loading}
            type="submit"
            variant="white"
          >
            {loading ? "Unlocking..." : "Unlock Console"}
          </Button>
        </form>
      </CadCell>
    </CadGridFrame>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100vh-140px)] flex-col items-center justify-center px-[17px] py-12 sm:px-6">
      <div className="flex w-full max-w-sm flex-col items-center">
        {/* Minimalist Logo & Brand Identity */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Link
            aria-label="AI Workstation Home"
            className="mb-3 transition-opacity hover:opacity-80"
            href="/"
          >
            <AiwsLogo size={32} />
          </Link>
          <h1 className="font-bold text-foreground text-lg tracking-tight">
            AI Workstation
          </h1>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            Enter operator passphrase to unlock console
          </p>
        </div>

        {/* Clean Centered CAD Login Card */}
        <div className="w-full">
          <Suspense
            fallback={
              <div className="h-44 w-full animate-pulse border border-border bg-muted/10" />
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        {/* Back Link */}
        <Link
          className="mt-6 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          href="/"
        >
          ← Return to public site
        </Link>
      </div>
    </main>
  );
}
