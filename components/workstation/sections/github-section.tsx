"use client";

import { useCallback, useEffect, useState } from "react";
import { GridCornerDots } from "@/components/design/line-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { workstationApi } from "@/lib/workstation/api";
import { CadCell, CadGridFrame } from "../cad-primitives";
import { VerbatimOutput } from "../verbatim-output";

export function GitHubSection() {
  const [status, setStatus] = useState<string | null>(null);
  const [actionOutput, setActionOutput] = useState<string | null>(null);
  const [appId, setAppId] = useState("");
  const [installationId, setInstallationId] = useState("");
  const [pemText, setPemText] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await workstationApi.getGithubStatus();
      setStatus(res.output);
    } catch (err) {
      setStatus(`Error fetching status: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(appId.trim() && installationId.trim() && pemText.trim())) {
      return;
    }

    try {
      setLoading(true);
      const res = await workstationApi.setupGithub(
        appId.trim(),
        installationId.trim(),
        pemText.trim()
      );
      setActionOutput(res.output);
      await fetchStatus();
    } catch (err) {
      setActionOutput(`Setup failed: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      setLoading(true);
      const res = await workstationApi.testGithub();
      setActionOutput(res.output);
    } catch (err) {
      setActionOutput(`Test failed: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 md:space-y-11">
      {/* Row 1: [GH-01] GitHub App Integration & Scopes + [GH-02] Configure GitHub App Credentials */}
      <CadGridFrame showRulers>
        <div className="relative w-full overflow-visible">
          <div className="grid w-full grid-cols-1 md:grid-cols-12">
            {/* Left 6 cols: [GH-01] GitHub App Integration & Scopes */}
            <CadCell
              bodyClassName="space-y-5"
              className="md:col-span-6"
              footerLeft="Auth · GitHub App Installation Token (RS256 JWT)"
              footerRight="API · api.github.com"
              headerAction={
                <>
                  <Button
                    className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                    disabled={loading}
                    onClick={handleTest}
                    size="xs"
                    variant="default"
                  >
                    Test Auth
                  </Button>
                  <Button
                    className="h-6 rounded-none px-2 font-mono text-[10px] uppercase tracking-wider"
                    disabled={loading}
                    onClick={fetchStatus}
                    size="xs"
                    variant="outline"
                  >
                    Refresh ↻
                  </Button>
                </>
              }
              index="GH-01"
              title="GitHub App Integration & Scopes"
            >
              <div>
                <div className="mb-2.5 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  Installation Token Specification
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-sm">
                        RS256 JWT
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                      Signing Algo
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-sm tabular-nums">
                        60m TTL
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                      Token Lease
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-sm">
                        Read/Write
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                      Repo Scopes
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 border-border/50 border-t pt-4">
                <div className="mb-2 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  Required App Permissions & Endpoints
                </div>
                {[
                  {
                    scope: "Contents & Pull Requests",
                    detail:
                      "Read & Write · Git push/pull & automated PR creation",
                  },
                  {
                    scope: "Checks, Workflows & Metadata",
                    detail:
                      "Read-Only · CI pipeline status & commit verification",
                  },
                  {
                    scope: "Installation Token Endpoint",
                    detail:
                      "POST https://api.github.com/app/installations/:id/access_tokens",
                  },
                ].map((item) => (
                  <div
                    className="flex flex-col justify-between border border-border/70 bg-muted/15 px-3.5 py-2.5"
                    key={item.scope}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                        {item.scope}
                      </span>
                      <span className="font-mono text-[10px] text-emerald-600 uppercase dark:text-emerald-400">
                        ● Granted
                      </span>
                    </div>
                    <div className="mt-0.5 truncate font-mono text-foreground text-xs">
                      {item.detail}
                    </div>
                  </div>
                ))}
              </div>
            </CadCell>

            {/* Right 6 cols: [GH-02] Configure GitHub App Credentials */}
            <CadCell
              bodyClassName="space-y-5"
              className="md:col-span-6"
              footerLeft="POST /api/github/setup · Bind App ID & PEM"
              footerRight="Keyring Encrypted"
              index="GH-02"
              title="Configure GitHub App Credentials"
            >
              <div>
                <div className="mb-2.5 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  Credential Vault Specification
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-sm">
                        PKCS#1/8
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                      PEM Format
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-sm">
                        0600 Mode
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                      Key Isolation
                    </span>
                  </div>

                  <div className="flex flex-col justify-between border border-border/80 bg-muted/15 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold font-mono text-foreground text-sm">
                        Auto-Mint
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                    <span className="mt-1 truncate font-medium text-muted-foreground text-xs">
                      Cred Helper
                    </span>
                  </div>
                </div>
              </div>

              <form
                className="space-y-3 border-border/50 border-t pt-4"
                onSubmit={handleSetup}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label
                      className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest"
                      htmlFor="github-app-id"
                    >
                      GitHub App ID
                    </label>
                    <Input
                      className="h-9 rounded-none border-border/80 bg-muted/15 font-mono text-xs"
                      disabled={loading}
                      id="github-app-id"
                      onChange={(e) => setAppId(e.target.value)}
                      placeholder="e.g. 894102"
                      value={appId}
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest"
                      htmlFor="github-installation-id"
                    >
                      Installation ID
                    </label>
                    <Input
                      className="h-9 rounded-none border-border/80 bg-muted/15 font-mono text-xs"
                      disabled={loading}
                      id="github-installation-id"
                      onChange={(e) => setInstallationId(e.target.value)}
                      placeholder="e.g. 52910481"
                      value={installationId}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label
                    className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest"
                    htmlFor="github-pem"
                  >
                    RSA Private Key (.pem)
                  </label>
                  <Textarea
                    className="min-h-[96px] resize-none rounded-none border-border/80 bg-muted/15 font-mono text-xs"
                    disabled={loading}
                    id="github-pem"
                    onChange={(e) => setPemText(e.target.value)}
                    placeholder={
                      "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
                    }
                    value={pemText}
                  />
                </div>

                <Button
                  className="h-9 w-full rounded-none font-mono text-xs uppercase tracking-wider"
                  disabled={
                    loading ||
                    !appId.trim() ||
                    !installationId.trim() ||
                    !pemText.trim()
                  }
                  type="submit"
                >
                  Save & Authenticate GitHub App →
                </Button>
              </form>
            </CadCell>
          </div>

          <GridCornerDots
            className="z-3 hidden md:block"
            columns={2}
            columnWeights={[6, 6]}
            rows={1}
          />
        </div>
      </CadGridFrame>

      {/* Row 2: [GH-03] Installation Status + [GH-04] Auth Verification Output */}
      <CadGridFrame showRulers>
        <div className="relative w-full overflow-visible">
          <div className="grid w-full grid-cols-1 md:grid-cols-12">
            <CadCell
              className="md:col-span-6"
              footerLeft="GET /api/github/status"
              footerRight="Installation State"
              index="GH-03"
              title="GitHub App Installation Status"
            >
              <VerbatimOutput label="GET /api/github/status" output={status} />
            </CadCell>

            <CadCell
              className="md:col-span-6"
              footerLeft="POST /api/github/test · setup"
              footerRight="Auth Handshake Output"
              index="GH-04"
              title="GitHub Operation & Handshake Telemetry"
            >
              <VerbatimOutput
                label="GitHub Operation Output"
                output={actionOutput}
              />
            </CadCell>
          </div>

          <GridCornerDots
            className="z-3 hidden md:block"
            columns={2}
            columnWeights={[6, 6]}
            rows={1}
          />
        </div>
      </CadGridFrame>
    </div>
  );
}
