import type { SVGProps } from "react";
import { GridCornerDots } from "@/components/design/line-grid";
import { DesignSectionHeader } from "@/components/design/section-header";
import { Badge } from "@/components/ui/badge";
import { Marquee } from "@/components/ui/marquee";

function ContainerIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  );
}

function LayersIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </svg>
  );
}

function ShieldIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function TerminalIcon(props: SVGProps<SVGSVGElement>) {
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
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" x2="20" y1="19" y2="19" />
    </svg>
  );
}

const marqueeData = [
  "Single-project `/workspace` bind mount",
  "Non-root sandbox user (UID `1001`)",
  "All Linux capabilities dropped (`CAP_DROP: ALL`)",
  "Enforced `512 MB` RAM · `1.5` CPU · `256` PID limits",
  "Hardened `/tmp` with `noexec,nosuid` & `no-new-privileges`",
  "Zero host Docker socket or `~/.ssh` exposure",
  "Persistent `~/.dsh` state across container rebuilds",
  "Persistent `~/.npm-global` DSH installation",
  "Unix-socket GitHub App broker (`github.sock`)",
  "Zero-PAT container Git authentication",
  "Host-isolated `secrets/github-app.pem` (`chmod 600`)",
  "Loopback-bound DeepSeek Harness (`127.0.0.1:4090`)",
  "Unified `ai` host operator CLI",
  "Instant repository switching via `ai use`",
  "SSH port-forwarding & Cloudflare Zero-Trust tunnels",
  "Concurrent DSH bridge & project app runner",
  "Automated runtime state backup & recovery",
  "Multi-arch Linux AMD64 & ARM64 GHCR images",
];

const features = [
  {
    code: "FEAT-01",
    category: "ISOLATION",
    title: "Single-Project Sandbox",
    description:
      "Projects remain clean Git repositories on the host under `~/projects/` while only the active repo mounts at `/workspace` inside a non-root UID `1001` sandbox with dropped Linux capabilities (`CAP_DROP: ALL`).",
    icon: ContainerIcon,
  },
  {
    code: "FEAT-02",
    category: "PERSISTENCE",
    title: "Persistent DSH Runtime",
    description:
      "DeepSeek Harness installation (`~/.npm-global`) and session state (`~/.dsh`) persist on the host outside the disposable container filesystem, surviving image rebuilds and upgrades.",
    icon: LayersIcon,
  },
  {
    code: "FEAT-03",
    category: "SECURITY",
    title: "Zero-PAT GitHub Broker",
    description:
      "Authenticate Git inside the container without copying `PAT` tokens or host `~/.ssh` keys. Short-lived GitHub App tokens flow over a host-managed `github.sock` Unix socket.",
    icon: ShieldIcon,
  },
  {
    code: "FEAT-04",
    category: "ORCHESTRATION",
    title: "Host 'ai' CLI & Tunneling",
    description:
      "Switch projects via `ai use`, control DSH and app runner processes, manage caches, and generate loopback SSH or Cloudflare tunnels on your Linux VPS from a single `ai` CLI.",
    icon: TerminalIcon,
  },
];

export function HomeFeaturesSection() {
  const m1 = marqueeData.slice(0, marqueeData.length / 3);
  const m2 = marqueeData.slice(
    marqueeData.length / 3,
    (marqueeData.length / 3) * 2
  );
  const m3 = marqueeData.slice((marqueeData.length / 3) * 2);

  return (
    <section
      aria-labelledby="features-heading"
      className="relative w-full pt-12 md:pt-24"
    >
      <div className="container mx-auto w-full overflow-visible">
        <DesignSectionHeader
          subtitle="Isolated Docker runtime, persistent DeepSeek Harness state, and zero-PAT GitHub broker"
          title="System capabilities"
          titleId="features-heading"
        />

        <div className="relative flex w-full flex-col overflow-visible border border-border bg-white dark:bg-black">
          {/* Top Hero + Marquee Block */}
          <div className="relative w-full overflow-visible pt-16 pb-10 sm:pt-24">
            <div className="mx-auto flex max-w-5xl flex-col items-center justify-center space-y-4 px-5 text-center md:px-10">
              <h3 className="max-w-3xl font-bold text-3xl text-foreground tracking-tight sm:text-4xl lg:text-5xl">
                Isolated AI coding workstation for your Linux VPS
              </h3>
              <p className="max-w-2xl text-muted-foreground text-sm leading-relaxed sm:text-base">
                Run DeepSeek Harness (DSH) and project workloads inside a
                capability-dropped Docker boundary — with persistent Harness
                state, single-project workspace mounting, and Unix-socket GitHub
                App authentication.
              </p>

              <div className="relative mx-auto w-full max-w-3xl overflow-hidden pt-4">
                <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-20 bg-linear-to-r from-white to-transparent dark:from-black" />
                <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-20 bg-linear-to-l from-white to-transparent dark:from-black" />

                <div className="flex flex-col">
                  <Marquee
                    className="[--duration:45s] [--gap:0.75rem]"
                    repeat={4}
                  >
                    {m1.map((q) => (
                      <Badge
                        className="rounded-none border-border bg-muted/50 px-3 py-1 text-foreground"
                        key={q}
                        size="lg"
                        variant="outline"
                      >
                        {q.split(/(`[^`]+`)/g).map((part, index) => {
                          if (part.startsWith("`") && part.endsWith("`")) {
                            return (
                              <code
                                className="font-mono text-primary text-xs"
                                // biome-ignore lint/suspicious/noArrayIndexKey: pure text parts
                                key={index}
                              >
                                {part.slice(1, -1)}
                              </code>
                            );
                          }
                          return part;
                        })}
                      </Badge>
                    ))}
                  </Marquee>

                  <Marquee
                    className="[--duration:50s] [--gap:0.75rem]"
                    repeat={4}
                    reverse
                  >
                    {m2.map((q) => (
                      <Badge
                        className="rounded-none border-border bg-muted/50 px-3 py-1 text-foreground"
                        key={q}
                        size="lg"
                        variant="outline"
                      >
                        {q.split(/(`[^`]+`)/g).map((part, index) => {
                          if (part.startsWith("`") && part.endsWith("`")) {
                            return (
                              <code
                                className="font-mono text-primary text-xs"
                                // biome-ignore lint/suspicious/noArrayIndexKey: pure text parts
                                key={index}
                              >
                                {part.slice(1, -1)}
                              </code>
                            );
                          }
                          return part;
                        })}
                      </Badge>
                    ))}
                  </Marquee>

                  <Marquee
                    className="[--duration:42s] [--gap:0.75rem]"
                    repeat={4}
                  >
                    {m3.map((q) => (
                      <Badge
                        className="rounded-none border-border bg-muted/50 px-3 py-1 text-foreground"
                        key={q}
                        size="lg"
                        variant="outline"
                      >
                        {q.split(/(`[^`]+`)/g).map((part, index) => {
                          if (part.startsWith("`") && part.endsWith("`")) {
                            return (
                              <code
                                className="font-mono text-primary text-xs"
                                // biome-ignore lint/suspicious/noArrayIndexKey: pure text parts
                                key={index}
                              >
                                {part.slice(1, -1)}
                              </code>
                            );
                          }
                          return part;
                        })}
                      </Badge>
                    ))}
                  </Marquee>
                </div>
              </div>
            </div>

            <GridCornerDots className="z-3" columns={1} rows={1} />
          </div>

          {/* Bottom 4-Column Feature Grid */}
          <div className="relative w-full overflow-visible border-border border-t border-dashed">
            <div className="grid grid-cols-1 divide-y divide-dashed divide-border overflow-visible sm:grid-cols-2 sm:divide-x lg:grid-cols-4 lg:divide-y-0">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    className="relative flex flex-col gap-5 overflow-visible px-5 py-6 last:border-b-0 lg:border-b-0 lg:px-6 lg:py-7"
                    key={feature.title}
                  >
                    <div className="flex items-center justify-between border-border/50 border-b pb-3">
                      <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                        [{feature.code}]
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                        {feature.category}
                      </span>
                    </div>

                    <Icon className="size-8 text-foreground/80" />

                    <div className="flex flex-1 flex-col gap-2">
                      <h4 className="font-semibold text-foreground text-lg tracking-tight">
                        {feature.title}
                      </h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.description
                          .split(/(`[^`]+`)/g)
                          .map((part, index) => {
                            if (part.startsWith("`") && part.endsWith("`")) {
                              return (
                                <code
                                  className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-[13px] text-foreground"
                                  // biome-ignore lint/suspicious/noArrayIndexKey: pure text parts
                                  key={index}
                                >
                                  {part.slice(1, -1)}
                                </code>
                              );
                            }
                            return part;
                          })}
                      </p>
                    </div>

                    <GridCornerDots
                      className="z-3 sm:hidden"
                      columns={1}
                      rows={1}
                    />
                  </div>
                );
              })}
            </div>

            <GridCornerDots
              className="z-3 hidden sm:block lg:hidden"
              columns={2}
              rows={2}
            />
            <GridCornerDots
              className="z-3 hidden lg:block"
              columns={4}
              rows={1}
            />
          </div>

          {/* Blueprint Grid Rulers & Hatch Corners */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            data-grid-rulers
          >
            <div className="absolute -top-8 left-0 block h-10 w-px bg-muted-foreground/40" />
            <div className="absolute top-0 -left-8 block h-px w-10 bg-muted-foreground/40" />
            <div className="absolute -top-8 right-0 block h-10 w-px bg-muted-foreground/40" />
            <div className="absolute top-0 -right-8 block h-px w-10 bg-muted-foreground/40" />

            <div className="absolute -bottom-8 left-0 block h-10 w-px bg-muted-foreground/40" />
            <div className="absolute bottom-0 -left-8 block h-px w-10 bg-muted-foreground/40" />
            <div className="absolute right-0 -bottom-8 block h-10 w-px bg-muted-foreground/40" />
            <div className="absolute -right-8 bottom-0 block h-px w-10 bg-muted-foreground/40" />

            <div className="absolute -top-8 -right-8 block h-6 w-6 bg-[repeating-linear-gradient(45deg,color-mix(in_oklch,var(--muted-foreground)_40%,transparent)_0,color-mix(in_oklch,var(--muted-foreground)_40%,transparent)_1px,transparent_0,transparent_50%)] bg-size-[5px_5px] bg-fixed opacity-80" />
            <div className="absolute -bottom-8 -left-8 block h-6 w-6 bg-[repeating-linear-gradient(45deg,color-mix(in_oklch,var(--muted-foreground)_40%,transparent)_0,color-mix(in_oklch,var(--muted-foreground)_40%,transparent)_1px,transparent_0,transparent_50%)] bg-size-[5px_5px] bg-fixed opacity-80" />
          </div>
        </div>
      </div>
    </section>
  );
}
