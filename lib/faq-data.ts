export type FaqCategory =
  | "all"
  | "architecture"
  | "auth"
  | "harness"
  | "operations";

export interface FaqItem {
  id: string;
  code: string;
  category: Exclude<FaqCategory, "all">;
  categoryLabel: string;
  question: string;
  answer: string;
  command?: string;
  docHref?: string;
  docLabel?: string;
}

export const CATEGORIES: {
  id: FaqCategory;
  label: string;
  code: string;
}[] = [
  { id: "all", label: "All Specifications", code: "ALL" },
  { id: "architecture", label: "Architecture & Ports", code: "ARC" },
  { id: "auth", label: "Auth & Tunnel", code: "AUT" },
  { id: "harness", label: "Harness & DSH", code: "DSH" },
  { id: "operations", label: "Cache & Operations", code: "OPS" },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-ai-workstation",
    code: "FAQ-01",
    category: "architecture",
    categoryLabel: "Architecture",
    question: "What is AI Workstation and how is it architected?",
    answer:
      "AI Workstation (ai-workstation) is a Docker-first local development runtime that unifies a Web Control Center (port 3001), a live preview reverse proxy (port 3000), the dsh AI terminal harness powered by opencode, Cloudflare Tunnel public sharing, GitHub App / PAT authentication, and host-mounted package caches in a single container environment.",
    command: "./scripts/ai setup && ./scripts/ai console",
    docHref: "/docs",
    docLabel: "Read Overview",
  },
  {
    id: "ports-3001-vs-3000",
    code: "FAQ-02",
    category: "architecture",
    categoryLabel: "Architecture",
    question:
      "What is the difference between localhost:3001 and localhost:3000?",
    answer:
      "Port 3001 hosts the AI Workstation Control Center UI and JSON REST API (/api/*). Port 3000 is the dedicated live preview reverse proxy that automatically detects and routes traffic to whichever application dev server is active inside the container (scanning ports 3002, 5173, 4321, 8080, 8000, 4000, and 3003) or a custom target URL.",
    command: "./scripts/ai preview status",
    docHref: "/docs/installation",
    docLabel: "Port Mapping Guide",
  },
  {
    id: "host-persistence-layout",
    code: "FAQ-03",
    category: "architecture",
    categoryLabel: "Architecture",
    question:
      "Where are my projects, dependency caches, and secrets stored on the host?",
    answer:
      "Everything persists on your host filesystem via bind mounts: projects live in ./workspace/ (/workspace in container), package manager stores live in ./cache/ (pnpm, npm, yarn, pip), runtime configuration lives in ./data/state/, and sensitive credentials (GitHub App PEM, PATs, Cloudflare tokens, model API keys) live in ./data/secrets/ (gitignored).",
    command: "ls -la workspace cache data/state data/secrets",
    docHref: "/docs/cache-and-state",
    docLabel: "Persistence & Mounts",
  },
  {
    id: "github-app-vs-pat",
    code: "FAQ-04",
    category: "auth",
    categoryLabel: "Authentication",
    question:
      "Should I use a GitHub App or a Personal Access Token (PAT) for Git authentication?",
    answer:
      "A GitHub App is strongly recommended. It mints RS256 JWTs signed with your local private key (data/secrets/github-app.pem) to exchange for short-lived 1-hour installation tokens, which the workstation background daemon refreshes every 45 minutes. PAT mode is supported as a quick fallback for personal repositories.",
    command: "./scripts/ai github-status",
    docHref: "/docs/github-app-setup",
    docLabel: "GitHub App Setup",
  },
  {
    id: "cloudflare-tunnel-modes",
    code: "FAQ-05",
    category: "auth",
    categoryLabel: "Authentication",
    question:
      "How do Quick Tunnel and Named Tunnel modes differ for public previews?",
    answer:
      "Quick Tunnel (CF_TUNNEL_MODE=quick) requires zero account setup and generates a temporary *.trycloudflare.com HTTPS URL pointing to port 3000. Named Tunnel (CF_TUNNEL_MODE=token) uses your CF_TUNNEL_TOKEN stored in data/secrets/cloudflare-tunnel-token to bind a persistent custom domain that survives restarts.",
    command: "./scripts/ai tunnel-start",
    docHref: "/docs/cloudflare-tunnel",
    docLabel: "Cloudflare Tunnel Guide",
  },
  {
    id: "pem-key-permissions",
    code: "FAQ-06",
    category: "auth",
    categoryLabel: "Authentication",
    question:
      "Why is my GitHub App private key failing validation during setup?",
    answer:
      "Ensure the downloaded .pem file is placed at data/secrets/github-app.pem with strict owner-only permissions (chmod 600), contains a valid RSA header (-----BEGIN RSA PRIVATE KEY-----), and that GITHUB_APP_ID in .env matches your numeric App ID rather than the app slug.",
    command:
      "chmod 600 data/secrets/github-app.pem && ./scripts/ai github-init",
    docHref: "/docs/github-app-setup",
    docLabel: "Troubleshooting Auth",
  },
  {
    id: "what-is-dsh",
    code: "FAQ-07",
    category: "harness",
    categoryLabel: "Harness & DSH",
    question: "What is dsh and how does it work inside the container?",
    answer:
      "dsh (Developer Shell) is an interactive AI-assisted shell inside the container that wraps opencode. You can execute standard Linux/Git commands directly or type natural language requests that are routed to your configured LLM provider. Built-in slash commands include /model, /status, /help, and /exit.",
    command: "./scripts/ai dsh",
    docHref: "/docs/harness-and-dsh",
    docLabel: "Harness & DSH Docs",
  },
  {
    id: "supported-model-providers",
    code: "FAQ-08",
    category: "harness",
    categoryLabel: "Harness & DSH",
    question: "Which AI model providers can I configure for dsh and opencode?",
    answer:
      "AI Workstation supports 8 provider backends out of the box: OpenRouter (default), OpenAI, Anthropic, Google Gemini, DeepSeek, Groq, xAI (Grok), and Custom OpenAI-compatible endpoints (such as Ollama, vLLM, or LiteLLM). Keys are stored in data/secrets/dsh-provider.env.",
    command: "./scripts/ai dsh-config",
    docHref: "/docs/harness-and-dsh",
    docLabel: "Provider Matrix",
  },
  {
    id: "switch-models-live",
    code: "FAQ-09",
    category: "harness",
    categoryLabel: "Harness & DSH",
    question:
      "Can I switch AI providers or models without rebuilding the Docker image?",
    answer:
      "Yes. You can switch providers and default models anytime from the Console's DSH Model Keys tab, by running ./scripts/ai dsh-config from your host terminal, or by running /model inside an active dsh session. Changes apply immediately.",
    command: "./scripts/ai harness-status",
    docHref: "/docs/harness-and-dsh",
    docLabel: "Switching Models",
  },
  {
    id: "state-backup-migration",
    code: "FAQ-10",
    category: "operations",
    categoryLabel: "Operations",
    question:
      "How do I back up my workstation configuration or migrate to a new host?",
    answer:
      "Use ./scripts/ai state-export (or the State Backup module in the Console) to create a timestamped .tar.gz archive of data/state/. By default, data/secrets/ is excluded so backups are safe to store; pass --include-secrets only when migrating to a trusted encrypted volume.",
    command: "./scripts/ai state-export",
    docHref: "/docs/cache-and-state",
    docLabel: "Backup & Restore",
  },
  {
    id: "cache-and-docker-cleanup",
    code: "FAQ-11",
    category: "operations",
    categoryLabel: "Operations",
    question:
      "Does clearing caches or pruning Docker resources affect my code in ./workspace?",
    answer:
      "No. Running ./scripts/ai cache-clear [pnpm|npm|yarn|pip|all] or triggering Docker Builder / Image / Log cleanup from the Console Maintenance tab only purges dependency stores, log files, or dangling Docker layers. Your repositories inside ./workspace/ are never modified.",
    command: "./scripts/ai cache-status",
    docHref: "/docs/cache-and-state",
    docLabel: "Cache Maintenance",
  },
  {
    id: "diagnose-startup-issues",
    code: "FAQ-12",
    category: "operations",
    categoryLabel: "Operations",
    question:
      "How do I diagnose container health, port conflicts, or daemon logs?",
    answer:
      "Run ./scripts/ai doctor for an automated 7-stage diagnostic audit covering Docker daemon availability, Compose v2, container running state, GitHub credentials, Cloudflare Tunnel status, and workspace permissions. For machine-readable output, use ./scripts/ai status --json.",
    command: "./scripts/ai doctor",
    docHref: "/docs/operations",
    docLabel: "Operations Runbook",
  },
];

export interface HomeFaqItem {
  id: string;
  code: string;
  category: string;
  question: string;
  answer: string;
}

export const HOME_FAQ_ITEMS: HomeFaqItem[] = [
  {
    id: "workspace-isolation",
    code: "FAQ-01",
    category: "ISOLATION",
    question:
      "How does single-project workspace mounting work on the host VPS?",
    answer:
      "All repositories remain standard Git working copies on your host Linux VPS under `~/projects/`. When you switch projects with `ai use <project>`, only that active repository is bind-mounted into the workstation container at `/workspace` — keeping inactive repositories completely unmounted and unreachable from the container runtime.",
  },
  {
    id: "dsh-persistence",
    code: "FAQ-02",
    category: "PERSISTENCE",
    question:
      "Will rebuilding or upgrading the Docker image erase DeepSeek Harness (DSH) state?",
    answer:
      "No. Both the DeepSeek Harness installation (`runtime/npm-global` → `~/.npm-global`) and its session history/configuration (`runtime/dsh` → `~/.dsh`) are persisted on the host filesystem outside the disposable container image. You can rebuild or pull a new workstation image without losing DSH state.",
  },
  {
    id: "github-broker",
    code: "FAQ-03",
    category: "SECURITY",
    question:
      "How does Git push and pull inside the container without a PAT or host SSH key?",
    answer:
      "The container uses a custom Git credential helper connected to a host-side Unix socket (`github.sock`). When Git requests credentials, the host broker signs a short-lived GitHub App installation token using `secrets/github-app.pem` (`chmod 600` on the host) and returns it over the socket without storing tokens on disk or exposing host `~/.ssh` keys.",
  },
  {
    id: "container-hardening",
    code: "FAQ-04",
    category: "HARDENING",
    question:
      "What Linux kernel and resource restrictions are enforced on the workstation container?",
    answer:
      "The workstation runs as non-root user `sandbox` (UID `1001`) with all Linux capabilities dropped (`cap_drop: ALL`), `no-new-privileges` enabled, `/tmp` mounted as `noexec,nosuid`, no host networking or Docker socket access, and strict cgroup limits (`512 MB` RAM, `1.5` CPUs, and `256` max PIDs).",
  },
  {
    id: "remote-access",
    code: "FAQ-05",
    category: "NETWORKING",
    question:
      "How do I access DeepSeek Harness (`127.0.0.1:4090`) and dev servers from my Mac or browser?",
    answer:
      "DSH binds strictly to loopback (`127.0.0.1:4090`) so it is never publicly exposed on your VPS interface. Run `ai preview` or `ai tunnel` to generate ready-to-run SSH local port-forwarding commands or route traffic through an authenticated Cloudflare Zero-Trust tunnel.",
  },
  {
    id: "concurrent-workflows",
    code: "FAQ-06",
    category: "WORKFLOW",
    question:
      "Can I run my project's dev server and DeepSeek Harness simultaneously?",
    answer:
      "Yes. The container entrypoint uses `tini` as PID 1 and manages separate process lifecycles for the DSH runtime (`ai dsh start`) and your project's application runner (`ai app start`), with independent PID tracking and log streams accessible via `ai status` and `ai logs`.",
  },
];

