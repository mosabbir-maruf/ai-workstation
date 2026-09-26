"use client";

import { type FormEvent, type SVGProps, useMemo, useState } from "react";
import { GridPageHero } from "@/components/design/grid-page-hero";
import { HomeFooter } from "@/components/design/home-footer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CadCell, CadGridFrame } from "@/components/workstation/cad-primitives";

function AlertTriangle(props: SVGProps<SVGSVGElement>) {
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
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

function ArrowUpRight(props: SVGProps<SVGSVGElement>) {
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
      <path d="M7 17L17 7M7 7h10v10" />
    </svg>
  );
}

function Check(props: SVGProps<SVGSVGElement>) {
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
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Copy(props: SVGProps<SVGSVGElement>) {
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
      <rect height="14" rx="2" ry="2" width="14" x="8" y="8" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function Send(props: SVGProps<SVGSVGElement>) {
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
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

type InquiryCategory =
  | "bug"
  | "feature"
  | "security"
  | "architecture"
  | "general";

type SeverityLevel = "P0-CRITICAL" | "P1-HIGH" | "P2-NORMAL" | "P3-LOW";

const CHANNELS = [
  {
    code: "C-01",
    title: "GitHub Issues & Tracker",
    badge: "PRIMARY",
    description:
      "Report container build failures, CLI script regressions, port forwarding bugs, or request new workstation features.",
    href: "https://github.com/mosabbir-maruf/ai-workstation/issues",
    cta: "Open Issue Tracker",
    footerLeft: "GITHUB ISSUES",
  },
  {
    code: "C-02",
    title: "Community Discussions",
    badge: "COMMUNITY",
    description:
      "Share custom `dsh` workflows, ask architecture questions, and connect with other AI Workstation builders.",
    href: "https://github.com/mosabbir-maruf/ai-workstation/discussions",
    cta: "Join Discussions",
    footerLeft: "FORUM & Q&A",
  },
  {
    code: "C-03",
    title: "Private Security Advisory",
    badge: "72H SLA",
    description:
      "Privately disclose vulnerabilities involving `secrets/`, GitHub App tokens, or Cloudflare Tunnel exposure.",
    href: "https://github.com/mosabbir-maruf/ai-workstation/security/advisories/new",
    cta: "Report Vulnerability",
    footerLeft: "CONFIDENTIAL CHANNEL",
  },
  {
    code: "C-04",
    title: "Maintainer & Repository",
    badge: "MAINTAINER",
    description:
      "Follow release notes, inspect source blueprints, or reach out directly to `@mosabbir-maruf`.",
    href: "https://github.com/mosabbir-maruf/ai-workstation",
    cta: "View Repository",
    footerLeft: "MOSABBIR-MARUF",
  },
] as const;

const CATEGORY_OPTIONS: {
  id: InquiryCategory;
  label: string;
  tag: string;
}[] = [
  { id: "bug", label: "Runtime Bug / Regression", tag: "[BUG]" },
  { id: "feature", label: "Feature / Module Request", tag: "[FEAT]" },
  { id: "architecture", label: "Docker / Tunnel Integration", tag: "[ARCH]" },
  { id: "security", label: "Security & Secret Handling", tag: "[SEC]" },
  { id: "general", label: "General Inquiry / Feedback", tag: "[GEN]" },
];

const SEVERITY_OPTIONS: SeverityLevel[] = [
  "P2-NORMAL",
  "P1-HIGH",
  "P0-CRITICAL",
  "P3-LOW",
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [handleOrEmail, setHandleOrEmail] = useState("");
  const [category, setCategory] = useState<InquiryCategory>("bug");
  const [severity, setSeverity] = useState<SeverityLevel>("P2-NORMAL");
  const [subject, setSubject] = useState("");
  const [environment, setEnvironment] = useState(
    "macOS / Docker Compose v2 / Node 22"
  );
  const [message, setMessage] = useState("");
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const defaultCategory =
    CATEGORY_OPTIONS[0] as (typeof CATEGORY_OPTIONS)[number];
  const selectedCategoryMeta =
    CATEGORY_OPTIONS.find((c) => c.id === category) ?? defaultCategory;

  const formattedPayload = useMemo(() => {
    const titleLine = `${selectedCategoryMeta.tag} ${subject || "AI Workstation Inquiry"}`;
    return [
      `# ${titleLine}`,
      "",
      `- **Reporter:** ${name || "Anonymous Operator"} (${handleOrEmail || "N/A"})`,
      `- **Category:** ${selectedCategoryMeta.label}`,
      `- **Priority:** ${severity}`,
      `- **Environment:** ${environment || "Standard Docker Runtime"}`,
      "",
      "## Description / Details",
      message || "_No description provided._",
    ].join("\n");
  }, [
    selectedCategoryMeta,
    subject,
    name,
    handleOrEmail,
    severity,
    environment,
    message,
  ]);

  const githubIssueUrl = useMemo(() => {
    const title = encodeURIComponent(
      `${selectedCategoryMeta.tag} ${subject || "Workstation Inquiry"}`
    );
    const body = encodeURIComponent(formattedPayload);
    return `https://github.com/mosabbir-maruf/ai-workstation/issues/new?title=${title}&body=${body}`;
  }, [selectedCategoryMeta, subject, formattedPayload]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const randomCode = Math.floor(100_000 + Math.random() * 900_000);
    setSubmittedRef(`DSP-${randomCode}`);
  };

  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(formattedPayload);
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  return (
    <main className="flex flex-1 flex-col space-y-10 md:space-y-12">
      {/* Same Hero Pattern as Console (/workstation) */}
      <section className="relative w-full">
        <div className="container mx-auto w-full overflow-visible">
          <GridPageHero
            action={
              <Button
                onClick={() => {
                  document
                    .getElementById("contact-dispatch")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                size="lg"
                variant="white"
              >
                Open Dispatch Console
              </Button>
            }
            subtitle="Direct communication channels, issue dispatch & security escalation"
            title="Contact"
          />
        </div>
      </section>

      {/* Main CAD Blueprint Content */}
      <section
        className="relative w-full space-y-10 pb-16 md:space-y-12 md:pb-24"
        id="contact-dispatch"
      >
        <div className="container mx-auto w-full space-y-10 overflow-visible md:space-y-12">
          {/* 1. Direct Communication Channels Matrix */}
          <CadGridFrame showRulers>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {CHANNELS.map((channel) => (
                <CadCell
                  footerLeft={channel.footerLeft}
                  footerRight={channel.badge}
                  index={channel.code}
                  key={channel.code}
                  title={channel.title}
                >
                  <div className="flex flex-1 flex-col justify-between gap-5">
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {channel.description
                        .split(/(`[^`]+`)/g)
                        .map((part, index) => {
                          if (part.startsWith("`") && part.endsWith("`")) {
                            return (
                              <code
                                className="rounded border border-border/60 bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-foreground"
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
                    <a
                      className="inline-flex w-fit items-center gap-1.5 border border-border bg-muted/20 px-3 py-2 font-mono text-foreground text-xs uppercase tracking-wider transition-colors hover:bg-foreground hover:text-background"
                      href={channel.href}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span>{channel.cta}</span>
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  </div>
                </CadCell>
              ))}
            </div>
          </CadGridFrame>

          {/* 2. Interactive Transmission Dispatch Console + Live Markdown Blueprint Preview */}
          <CadGridFrame showRulers>
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <CadCell
                className="lg:col-span-7"
                footerLeft="STRUCTURED DIAGNOSTIC DISPATCH FORM"
                footerRight="READY TO TRANSMIT"
                index="C-05"
                title="Transmission Dispatch Console"
              >
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider"
                        htmlFor="contact-name"
                      >
                        Operator Name
                      </label>
                      <input
                        className="h-10 border border-border bg-muted/20 px-3 font-mono text-foreground text-xs placeholder:text-muted-foreground focus:border-foreground/40 focus:bg-background focus:outline-none"
                        id="contact-name"
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Mosabbir Maruf"
                        required
                        type="text"
                        value={name}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider"
                        htmlFor="contact-handle"
                      >
                        GitHub Handle or Email
                      </label>
                      <input
                        className="h-10 border border-border bg-muted/20 px-3 font-mono text-foreground text-xs placeholder:text-muted-foreground focus:border-foreground/40 focus:bg-background focus:outline-none"
                        id="contact-handle"
                        onChange={(e) => setHandleOrEmail(e.target.value)}
                        placeholder="e.g. @mosabbir-maruf or dev@domain.com"
                        required
                        type="text"
                        value={handleOrEmail}
                      />
                    </div>
                  </div>

                  {/* Category & Severity */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                        Dispatch Category
                      </span>
                      <Select
                        onValueChange={(val) => {
                          if (val) {
                            setCategory(val as InquiryCategory);
                          }
                        }}
                        value={category}
                      >
                        <SelectTrigger
                          aria-label="Dispatch Category"
                          className="h-10! w-full rounded-none border-border bg-muted/20 px-3 font-mono text-foreground text-xs shadow-none focus-visible:border-foreground/40 focus-visible:ring-0 dark:bg-muted/20 dark:hover:bg-muted/30"
                        >
                          <SelectValue>
                            {selectedCategoryMeta.tag}{" "}
                            {selectedCategoryMeta.label}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent
                          alignItemWithTrigger={false}
                          className="rounded-none border border-border bg-background font-mono text-xs shadow-lg ring-0"
                        >
                          {CATEGORY_OPTIONS.map((opt) => (
                            <SelectItem
                              className="rounded-none py-2 font-mono text-xs"
                              key={opt.id}
                              value={opt.id}
                            >
                              <span className="text-emerald-500">
                                {opt.tag}
                              </span>{" "}
                              <span>{opt.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                        Priority Level
                      </span>
                      <Select
                        onValueChange={(val) => {
                          if (val) {
                            setSeverity(val as SeverityLevel);
                          }
                        }}
                        value={severity}
                      >
                        <SelectTrigger
                          aria-label="Priority Level"
                          className="h-10! w-full rounded-none border-border bg-muted/20 px-3 font-mono text-foreground text-xs shadow-none focus-visible:border-foreground/40 focus-visible:ring-0 dark:bg-muted/20 dark:hover:bg-muted/30"
                        >
                          <SelectValue>{severity}</SelectValue>
                        </SelectTrigger>
                        <SelectContent
                          alignItemWithTrigger={false}
                          className="rounded-none border border-border bg-background font-mono text-xs shadow-lg ring-0"
                        >
                          {SEVERITY_OPTIONS.map((sev) => (
                            <SelectItem
                              className="rounded-none py-2 font-mono text-xs"
                              key={sev}
                              value={sev}
                            >
                              {sev}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Subject & Environment */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider"
                        htmlFor="contact-subject"
                      >
                        Subject Summary
                      </label>
                      <input
                        className="h-10 border border-border bg-muted/20 px-3 font-mono text-foreground text-xs placeholder:text-muted-foreground focus:border-foreground/40 focus:bg-background focus:outline-none"
                        id="contact-subject"
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Preview proxy port 3000 WebSocket upgrade"
                        required
                        type="text"
                        value={subject}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider"
                        htmlFor="contact-env"
                      >
                        Host OS / Runtime Environment
                      </label>
                      <input
                        className="h-10 border border-border bg-muted/20 px-3 font-mono text-foreground text-xs placeholder:text-muted-foreground focus:border-foreground/40 focus:bg-background focus:outline-none"
                        id="contact-env"
                        onChange={(e) => setEnvironment(e.target.value)}
                        placeholder="macOS / Linux / Docker version"
                        type="text"
                        value={environment}
                      />
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider"
                      htmlFor="contact-message"
                    >
                      Technical Details / Reproduction Steps / Logs
                    </label>
                    <textarea
                      className="min-h-[140px] border border-border bg-muted/20 p-3 font-mono text-foreground text-xs leading-relaxed placeholder:text-muted-foreground focus:border-foreground/40 focus:bg-background focus:outline-none"
                      id="contact-message"
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe the behavior, expected outcome, or paste output from ./scripts/ai doctor..."
                      required
                      value={message}
                    />
                  </div>

                  {category === "security" && (
                    <div className="flex items-start gap-2.5 border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                      <div className="flex flex-col gap-1">
                        <span className="font-mono font-semibold text-amber-500 uppercase tracking-wider">
                          SECURITY DISCLOSURE NOTICE
                        </span>
                        <span className="text-muted-foreground">
                          Do not include live{" "}
                          <code className="font-mono">.pem</code> keys, PATs, or
                          Cloudflare tokens in public issues. Use the{" "}
                          <a
                            className="underline hover:text-foreground"
                            href="https://github.com/mosabbir-maruf/ai-workstation/security/advisories/new"
                            rel="noreferrer"
                            target="_blank"
                          >
                            Private Security Advisory
                          </a>{" "}
                          for sensitive reports.
                        </span>
                      </div>
                    </div>
                  )}

                  {submittedRef && (
                    <div className="flex items-center justify-between gap-3 border border-emerald-500/40 bg-emerald-500/10 p-3.5">
                      <div className="flex items-center gap-2.5">
                        <Check className="size-4 text-emerald-500" />
                        <div className="flex flex-col">
                          <span className="font-mono font-semibold text-emerald-500 text-xs uppercase tracking-wider">
                            DISPATCH LOGGED [{submittedRef}]
                          </span>
                          <span className="text-muted-foreground text-xs">
                            Payload prepared. You can now submit directly to
                            GitHub Issues with one click or copy the markdown
                            packet.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      className="inline-flex items-center gap-2 border border-border bg-foreground px-4 py-2.5 font-mono text-background text-xs uppercase tracking-wider transition-opacity hover:opacity-90"
                      type="submit"
                    >
                      <Send className="size-3.5" />
                      <span>Log Dispatch Packet</span>
                    </button>

                    <a
                      className="inline-flex items-center gap-2 border border-border bg-muted/30 px-4 py-2.5 font-mono text-foreground text-xs uppercase tracking-wider hover:bg-muted"
                      href={githubIssueUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span>Open Pre-filled GitHub Issue</span>
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  </div>
                </form>
              </CadCell>

              <CadCell
                className="lg:col-span-5"
                footerLeft="DIAGNOSTIC TIP: ATTACH ./scripts/ai status --json"
                footerRight="MARKDOWN FORMAT"
                headerAction={
                  <Button
                    className="h-6 rounded-none px-2.5 font-mono text-[10px] uppercase tracking-wider"
                    onClick={handleCopyPayload}
                    size="xs"
                    variant="outline"
                  >
                    {copiedPayload ? (
                      <span className="inline-flex items-center gap-1 text-emerald-500">
                        <Check className="size-3" />
                        Copied
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Copy className="size-3" />
                        Copy Markdown
                      </span>
                    )}
                  </Button>
                }
                index="C-06"
                title="Live Payload Preview & SLA Matrix"
              >
                <div className="flex flex-1 flex-col justify-between gap-4">
                  <pre className="min-h-[240px] flex-1 overflow-x-auto whitespace-pre-wrap border border-border bg-muted/15 p-4 font-mono text-foreground text-xs leading-relaxed">
                    <code>{formattedPayload}</code>
                  </pre>

                  <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                    <div className="border border-border bg-muted/15 p-3">
                      <div className="text-[10px] text-muted-foreground uppercase">
                        Security Ack
                      </div>
                      <div className="mt-1 font-semibold text-emerald-500">
                        &lt; 72 Hours
                      </div>
                    </div>
                    <div className="border border-border bg-muted/15 p-3">
                      <div className="text-[10px] text-muted-foreground uppercase">
                        Triage Update
                      </div>
                      <div className="mt-1 font-semibold text-foreground">
                        &lt; 7 Days
                      </div>
                    </div>
                  </div>
                </div>
              </CadCell>
            </div>
          </CadGridFrame>
        </div>
      </section>

      <HomeFooter />
    </main>
  );
}
