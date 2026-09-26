import type { ActiveProjectGitInfo, PreviewResponse } from "@/lib/workstation/api";

export type SearchCategory =
  | "Console"
  | "Widget"
  | "Action"
  | "Docs"
  | "Site"
  | "Project"
  | "Network";

export type SearchTagGroup = "console" | "actions" | "docs" | "site";

export interface GlobalSearchItem {
  id: string;
  title: string;
  description: string;
  category: SearchCategory;
  tagGroup: SearchTagGroup;
  keywords: string[];
  url?: string;
  external?: boolean;
  actionId?: string;
  badge?: string;
  priority?: number;
}

export interface DynamicSearchContext {
  projects?: Array<{ name: string; active: boolean }>;
  activeProject?: ActiveProjectGitInfo;
  preview?: PreviewResponse;
  tunnelHost?: string;
}

/**
 * Static canonical index of all permanent application sections,
 * modules, widgets, executable operations, navigation routes, and docs.
 */
export const CANONICAL_SEARCH_ITEMS: GlobalSearchItem[] = [
  // ==========================================
  // 1. CONSOLE MODULES (All 12 Workstation Tabs)
  // ==========================================
  {
    id: "module-overview",
    title: "Console: System Overview",
    description:
      "Real-time telemetry, service matrix S-01..S-05, port map, CPU/RAM charts, and operator notes",
    category: "Console",
    tagGroup: "console",
    url: "/workstation?tab=overview",
    keywords: [
      "overview",
      "status",
      "health",
      "telemetry",
      "cpu",
      "ram",
      "matrix",
      "services",
      "ports",
      "charts",
      "dashboard",
    ],
    badge: "TAB 01",
    priority: 30,
  },
  {
    id: "module-app",
    title: "Console: App Runtime",
    description:
      "Manage Next.js/Node dev server, view PID, bind 0.0.0.0, and stream runtime logs",
    category: "Console",
    tagGroup: "console",
    url: "/workstation?tab=app",
    keywords: [
      "app",
      "runtime",
      "dev server",
      "nextjs",
      "node",
      "pid",
      "port 3000",
      "runner",
      "host",
    ],
    badge: "TAB 02",
    priority: 28,
  },
  {
    id: "module-preview",
    title: "Console: Live Preview",
    description:
      "Inspect active dev ports (3000, 5173, 8000), SSH port forwarding commands, and Cloudflare preview URLs",
    category: "Console",
    tagGroup: "console",
    url: "/workstation?tab=preview",
    keywords: [
      "preview",
      "live preview",
      "url",
      "ports",
      "ssh forwarding",
      "tunnel",
      "anywhere",
      "loopback",
    ],
    badge: "TAB 03",
    priority: 26,
  },
  {
    id: "module-projects",
    title: "Console: Workspace Projects",
    description:
      "Hot-swap active repository mounted into /workspace sandbox, clone git repos, or remove projects",
    category: "Console",
    tagGroup: "console",
    url: "/workstation?tab=projects",
    keywords: [
      "projects",
      "workspace",
      "repository",
      "git clone",
      "ai use",
      "hot-swap",
      "mount",
      "sandbox",
    ],
    badge: "TAB 04",
    priority: 28,
  },
  {
    id: "module-git",
    title: "Console: Git Sync",
    description:
      "Track modified/dirty files, pull latest branch commits, and push through zero-PAT host socket",
    category: "Console",
    tagGroup: "console",
    url: "/workstation?tab=git",
    keywords: [
      "git",
      "sync",
      "pull",
      "push",
      "commit",
      "branch",
      "dirty files",
      "vcs",
      "diff",
    ],
    badge: "TAB 05",
    priority: 26,
  },
  {
    id: "module-github",
    title: "Console: GitHub App Broker",
    description:
      "Zero-PAT authentication broker over Unix socket github.sock with temporary installation tokens",
    category: "Console",
    tagGroup: "console",
    url: "/workstation?tab=github",
    keywords: [
      "github",
      "app",
      "broker",
      "socket",
      "pat",
      "pem",
      "private key",
      "auth",
      "token",
      "installation",
    ],
    badge: "TAB 06",
    priority: 24,
  },
  {
    id: "module-tunnel",
    title: "Console: Edge Tunnel",
    description:
      "Cloudflare Named Tunnel ingress setup, custom appHost and dshHost routing, and port synchronization",
    category: "Console",
    tagGroup: "console",
    url: "/workstation?tab=tunnel",
    keywords: [
      "tunnel",
      "cloudflare",
      "edge",
      "cloudflared",
      "anywhere",
      "hosts",
      "ingress",
      "dns",
      "domain",
    ],
    badge: "TAB 07",
    priority: 24,
  },
  {
    id: "module-harness",
    title: "Console: Harness + DSH",
    description:
      "DeepSeek Harness daemon on port 4090/4091, persistent npm-global runtime, and DSH version upgrades",
    category: "Console",
    tagGroup: "console",
    url: "/workstation?tab=harness",
    keywords: [
      "harness",
      "dsh",
      "deepseek",
      "agent",
      "bridge",
      "4090",
      "tcp",
      "version",
      "runner",
    ],
    badge: "TAB 08",
    priority: 26,
  },
  {
    id: "module-dsh-keys",
    title: "Console: DSH Model Keys & Settings",
    description:
      "Configure AI model API credentials, DeepSeek / OpenAI / Anthropic endpoints, and ~/.dsh/settings.json",
    category: "Console",
    tagGroup: "console",
    url: "/workstation?tab=dsh-keys",
    keywords: [
      "dsh keys",
      "api keys",
      "secrets",
      "settings",
      "deepseek key",
      "openai",
      "anthropic",
      "models",
      "credentials",
    ],
    badge: "TAB 09",
    priority: 22,
  },
  {
    id: "module-maintenance",
    title: "Console: System Maintenance",
    description:
      "Run system diagnostics doctor, update workstation repo, upgrade Docker dependencies, and prune caches",
    category: "Console",
    tagGroup: "console",
    url: "/workstation?tab=maintenance",
    keywords: [
      "maintenance",
      "doctor",
      "update",
      "upgrade",
      "cache",
      "prune",
      "cleanup",
      "diagnostics",
      "disk",
    ],
    badge: "TAB 10",
    priority: 22,
  },
  {
    id: "module-state",
    title: "Console: State Backup & Migration",
    description:
      "Export portable .tar.gz state archive, download state snapshot, or restore DSH sessions & configurations",
    category: "Console",
    tagGroup: "console",
    url: "/workstation?tab=state",
    keywords: [
      "state",
      "backup",
      "export",
      "import",
      "restore",
      "tar.gz",
      "archive",
      "persistence",
      "sessions",
    ],
    badge: "TAB 11",
    priority: 22,
  },
  {
    id: "module-logs",
    title: "Console: Workstation Logs",
    description:
      "Live Server-Sent Events (SSE) log stream for Workstation sandbox, App runner, Harness agent, and Syslog",
    category: "Console",
    tagGroup: "console",
    url: "/workstation?tab=logs",
    keywords: [
      "logs",
      "streaming",
      "sse",
      "tail",
      "console",
      "syslog",
      "audit",
      "stderr",
      "stdout",
      "output",
    ],
    badge: "TAB 12",
    priority: 24,
  },

  // ==========================================
  // 2. DASHBOARD WIDGETS
  // ==========================================
  {
    id: "widget-services",
    title: "Widget: Service Health Matrix",
    description:
      "Status tiles S-01 (Workstation), S-02 (App), S-03 (DSH Bridge), S-04 (Broker IPC), S-05 (Tunnel Edge)",
    category: "Widget",
    tagGroup: "console",
    url: "/workstation?tab=overview#services",
    keywords: [
      "services",
      "matrix",
      "s-01",
      "s-02",
      "s-03",
      "s-04",
      "s-05",
      "health matrix",
      "status tiles",
      "uptime",
    ],
    badge: "WIDGET",
    priority: 18,
  },
  {
    id: "widget-cpu",
    title: "Widget: CPU Dynamics Area Chart",
    description:
      "Multi-core processor load average (1m, 5m, 15m), utilization curves, and compute load",
    category: "Widget",
    tagGroup: "console",
    url: "/workstation?tab=overview#charts",
    keywords: [
      "cpu chart",
      "processor",
      "load average",
      "cores",
      "compute",
      "utilization",
      "telemetry",
    ],
    badge: "WIDGET",
    priority: 16,
  },
  {
    id: "widget-ram",
    title: "Widget: Physical RAM Distribution Bar Chart",
    description:
      "Physical memory distribution breakdown: active processes, buffer, cache, and free memory in gigabytes",
    category: "Widget",
    tagGroup: "console",
    url: "/workstation?tab=overview#charts",
    keywords: [
      "ram chart",
      "memory distribution",
      "physical memory",
      "buffer",
      "cache",
      "memory usage",
    ],
    badge: "WIDGET",
    priority: 16,
  },
  {
    id: "widget-storage",
    title: "Widget: Storage Ring Chart",
    description:
      "Workstation volume allocation, Docker container overlay filesystem, and persistent directory quotas",
    category: "Widget",
    tagGroup: "console",
    url: "/workstation?tab=overview#charts",
    keywords: [
      "storage chart",
      "disk",
      "volume",
      "overlay",
      "ring chart",
      "disk space",
    ],
    badge: "WIDGET",
    priority: 14,
  },
  {
    id: "widget-throughput",
    title: "Widget: Network Throughput Chart",
    description:
      "Historical network ingress, egress, and buffered packet metrics across internal and edge interfaces",
    category: "Widget",
    tagGroup: "console",
    url: "/workstation?tab=overview#charts",
    keywords: [
      "network chart",
      "throughput",
      "bandwidth",
      "ingress",
      "egress",
      "traffic",
      "packets",
    ],
    badge: "WIDGET",
    priority: 14,
  },
  {
    id: "widget-portmap",
    title: "Widget: Active Port Map",
    description:
      "Listening port mappings: Port 3000 (App), Port 4090 (DSH), and SSH port-forwarding quick commands",
    category: "Widget",
    tagGroup: "console",
    url: "/workstation?tab=overview#ports",
    keywords: [
      "port map",
      "listening ports",
      "port 3000",
      "port 4090",
      "ssh forwarding",
      "loopback",
    ],
    badge: "WIDGET",
    priority: 18,
  },
  {
    id: "widget-minilogs",
    title: "Widget: Live Log Tail Stream",
    description:
      "Real-time terminal log viewer with level filtering (INFO, WARN, ERROR), pause, and auto-scroll",
    category: "Widget",
    tagGroup: "console",
    url: "/workstation?tab=overview#logs",
    keywords: [
      "log tail",
      "mini logs",
      "live log",
      "terminal stream",
      "stdout",
      "stderr",
    ],
    badge: "WIDGET",
    priority: 16,
  },
  {
    id: "widget-notes",
    title: "Widget: Operator Notes Scratchpad",
    description:
      "Debounced local scratchpad for deployment runbooks, operational notes, and session checklists",
    category: "Widget",
    tagGroup: "console",
    url: "/workstation?tab=overview#notes",
    keywords: [
      "operator notes",
      "scratchpad",
      "notes",
      "memo",
      "checklist",
      "localstorage",
    ],
    badge: "WIDGET",
    priority: 15,
  },

  // ==========================================
  // 3. EXECUTABLE ACTIONS
  // ==========================================
  {
    id: "action-run-app",
    title: "Action: Run App Server",
    description:
      "Launch dev server with --host 0.0.0.0 binding inside workspace (POST /api/app/run)",
    category: "Action",
    tagGroup: "actions",
    actionId: "run-app",
    keywords: [
      "run app",
      "start app",
      "dev server",
      "npm run dev",
      "pnpm dev",
      "launch app",
      "start dev",
    ],
    badge: "EXECUTE",
    priority: 35,
  },
  {
    id: "action-stop-app",
    title: "Action: Stop App Server",
    description:
      "Terminate active application development server daemon (POST /api/app/stop)",
    category: "Action",
    tagGroup: "actions",
    actionId: "stop-app",
    keywords: [
      "stop app",
      "kill dev server",
      "halt app",
      "terminate app",
      "stop node",
    ],
    badge: "EXECUTE",
    priority: 18,
  },
  {
    id: "action-restart-app",
    title: "Action: Restart App Server",
    description:
      "Bounce and restart the application development server process (POST /api/app/restart)",
    category: "Action",
    tagGroup: "actions",
    actionId: "restart-app",
    keywords: [
      "restart app",
      "reload dev server",
      "reboot app",
      "bounce app",
    ],
    badge: "EXECUTE",
    priority: 22,
  },
  {
    id: "action-start-workstation",
    title: "Action: Start Workstation Container",
    description:
      "Spin up the capability-dropped Docker container runtime (POST /api/workstation/start)",
    category: "Action",
    tagGroup: "actions",
    actionId: "start-workstation",
    keywords: [
      "start workstation",
      "boot container",
      "start docker",
      "spin up",
      "launch container",
    ],
    badge: "EXECUTE",
    priority: 25,
  },
  {
    id: "action-stop-workstation",
    title: "Action: Stop Workstation Container",
    description:
      "Gracefully halt the workstation container sandbox (POST /api/workstation/stop)",
    category: "Action",
    tagGroup: "actions",
    actionId: "stop-workstation",
    keywords: [
      "stop workstation",
      "shutdown container",
      "stop docker",
      "halt workstation",
    ],
    badge: "EXECUTE",
    priority: 16,
  },
  {
    id: "action-restart-workstation",
    title: "Action: Restart Workstation Container",
    description:
      "Perform a clean reboot of the workstation container runtime (POST /api/workstation/restart)",
    category: "Action",
    tagGroup: "actions",
    actionId: "restart-workstation",
    keywords: [
      "restart workstation",
      "reboot container",
      "reset docker",
      "bounce workstation",
    ],
    badge: "EXECUTE",
    priority: 20,
  },
  {
    id: "action-git-pull",
    title: "Action: Git Pull",
    description:
      "Fast-forward fetch and merge latest remote commits on active branch (POST /api/git/pull)",
    category: "Action",
    tagGroup: "actions",
    actionId: "git-pull",
    keywords: [
      "git pull",
      "pull",
      "fetch",
      "git sync",
      "update code",
      "git update",
    ],
    badge: "EXECUTE",
    priority: 30,
  },
  {
    id: "action-start-harness",
    title: "Action: Start DeepSeek Harness",
    description:
      "Initialize and start the DSH agent daemon on 127.0.0.1:4090 (POST /api/harness/start)",
    category: "Action",
    tagGroup: "actions",
    actionId: "start-harness",
    keywords: [
      "start harness",
      "start dsh",
      "deepseek harness",
      "agent start",
      "run harness",
    ],
    badge: "EXECUTE",
    priority: 24,
  },
  {
    id: "action-stop-harness",
    title: "Action: Stop DeepSeek Harness",
    description:
      "Stop the running DeepSeek Harness agent daemon (POST /api/harness/stop)",
    category: "Action",
    tagGroup: "actions",
    actionId: "stop-harness",
    keywords: ["stop harness", "stop dsh", "agent stop", "kill harness"],
    badge: "EXECUTE",
    priority: 16,
  },
  {
    id: "action-restart-harness",
    title: "Action: Restart DeepSeek Harness",
    description:
      "Restart the Harness agent process and reset TCP socket (POST /api/harness/restart)",
    category: "Action",
    tagGroup: "actions",
    actionId: "restart-harness",
    keywords: [
      "restart harness",
      "reload dsh",
      "agent restart",
      "bounce harness",
    ],
    badge: "EXECUTE",
    priority: 18,
  },
  {
    id: "action-start-tunnel",
    title: "Action: Start Cloudflare Tunnel",
    description:
      "Establish Cloudflare Named Tunnel edge ingress daemon (POST /api/tunnel/start)",
    category: "Action",
    tagGroup: "actions",
    actionId: "start-tunnel",
    keywords: [
      "start tunnel",
      "cloudflared start",
      "edge ingress",
      "connect tunnel",
    ],
    badge: "EXECUTE",
    priority: 20,
  },
  {
    id: "action-stop-tunnel",
    title: "Action: Stop Cloudflare Tunnel",
    description:
      "Disconnect active Cloudflare edge ingress tunnel daemon (POST /api/tunnel/stop)",
    category: "Action",
    tagGroup: "actions",
    actionId: "stop-tunnel",
    keywords: [
      "stop tunnel",
      "cloudflared stop",
      "disconnect tunnel",
      "halt tunnel",
    ],
    badge: "EXECUTE",
    priority: 14,
  },
  {
    id: "action-sync-tunnel",
    title: "Action: Sync Tunnel Port Mapping",
    description:
      "Re-sync Cloudflare tunnel routing with active application port (POST /api/tunnel/sync)",
    category: "Action",
    tagGroup: "actions",
    actionId: "sync-tunnel",
    keywords: [
      "sync tunnel",
      "tunnel port",
      "sync port",
      "re-route tunnel",
      "update port",
    ],
    badge: "EXECUTE",
    priority: 16,
  },
  {
    id: "action-test-github",
    title: "Action: Test GitHub App Broker",
    description:
      "Verify Unix domain socket token generation with GitHub API (POST /api/github/test)",
    category: "Action",
    tagGroup: "actions",
    actionId: "test-github",
    keywords: [
      "test github",
      "check broker",
      "verify pat",
      "github socket",
      "test token",
      "test auth",
    ],
    badge: "EXECUTE",
    priority: 22,
  },
  {
    id: "action-system-doctor",
    title: "Action: Run System Doctor",
    description:
      "Execute environment diagnostic health check across Docker, sockets, ports, and permissions (POST /api/system/doctor)",
    category: "Action",
    tagGroup: "actions",
    actionId: "system-doctor",
    keywords: [
      "doctor",
      "diagnostics",
      "system check",
      "health check",
      "audit",
      "system doctor",
    ],
    badge: "EXECUTE",
    priority: 25,
  },
  {
    id: "action-system-update",
    title: "Action: System Update",
    description:
      "Pull latest repository updates and refresh CLI scripts (POST /api/system/update)",
    category: "Action",
    tagGroup: "actions",
    actionId: "system-update",
    keywords: [
      "system update",
      "update workstation",
      "git update",
      "pull scripts",
    ],
    badge: "EXECUTE",
    priority: 16,
  },
  {
    id: "action-system-upgrade",
    title: "Action: System Upgrade",
    description:
      "Rebuild workstation Docker image with latest system dependencies (POST /api/system/upgrade)",
    category: "Action",
    tagGroup: "actions",
    actionId: "system-upgrade",
    keywords: [
      "system upgrade",
      "rebuild docker",
      "upgrade dependencies",
      "docker build",
    ],
    badge: "EXECUTE",
    priority: 16,
  },
  {
    id: "action-clear-cache",
    title: "Action: Clear System Cache",
    description:
      "Prune Docker builder cache, npm global store, and temp logs safely (POST /api/cache/clear)",
    category: "Action",
    tagGroup: "actions",
    actionId: "clear-cache",
    keywords: [
      "clear cache",
      "prune cache",
      "docker prune",
      "clean npm",
      "free disk",
      "prune",
    ],
    badge: "EXECUTE",
    priority: 20,
  },
  {
    id: "action-export-state",
    title: "Action: Export State Archive",
    description:
      "Package DSH sessions, model settings, and keys into a compressed .tar.gz archive (POST /api/state/export)",
    category: "Action",
    tagGroup: "actions",
    actionId: "export-state",
    keywords: [
      "export state",
      "download state",
      "backup",
      "tar.gz",
      "snapshot",
      "export archive",
    ],
    badge: "EXECUTE",
    priority: 22,
  },
  {
    id: "action-toggle-theme",
    title: "Action: Toggle Dark / Light Theme",
    description:
      "Switch application interface between dark and light appearance modes",
    category: "Action",
    tagGroup: "actions",
    actionId: "toggle-theme",
    keywords: [
      "theme",
      "dark mode",
      "light mode",
      "appearance",
      "toggle theme",
      "switch mode",
    ],
    badge: "TOGGLE",
    priority: 20,
  },

  // ==========================================
  // 4. DOCUMENTATION PAGES
  // ==========================================
  {
    id: "doc-overview",
    title: "Docs: Architecture Overview",
    description:
      "Reusable, isolated AI coding workstation for running DeepSeek Harness on remote Linux VPS",
    category: "Docs",
    tagGroup: "docs",
    url: "/docs",
    keywords: [
      "docs",
      "documentation",
      "overview",
      "architecture",
      "vps",
      "docker",
      "dsh",
      "guide",
    ],
    badge: "DOCS",
    priority: 24,
  },
  {
    id: "doc-installation",
    title: "Docs: Installation & Host Setup",
    description:
      "Host VPS requirements, automated installation script walkthrough, and environment variables",
    category: "Docs",
    tagGroup: "docs",
    url: "/docs/installation",
    keywords: [
      "install",
      "installation",
      "setup",
      "requirements",
      "quickstart",
      "env vars",
      "script",
    ],
    badge: "DOCS",
    priority: 22,
  },
  {
    id: "doc-cli",
    title: "Docs: CLI Reference",
    description:
      "Complete command reference for the ai CLI: projects, git, runtime, harness, tunnel, and state",
    category: "Docs",
    tagGroup: "docs",
    url: "/docs/cli-reference",
    keywords: [
      "cli",
      "ai",
      "commands",
      "reference",
      "flags",
      "options",
      "terminal",
      "syntax",
    ],
    badge: "DOCS",
    priority: 25,
  },
  {
    id: "doc-harness",
    title: "Docs: Harness & DSH Architecture",
    description:
      "DeepSeek Harness persistent npm-global installation, internal 4090/4091 TCP bridge, and upgrades",
    category: "Docs",
    tagGroup: "docs",
    url: "/docs/harness-and-dsh",
    keywords: [
      "harness",
      "dsh",
      "deepseek",
      "bridge",
      "4090",
      "persistent",
      "npm global",
      "runtime",
    ],
    badge: "DOCS",
    priority: 20,
  },
  {
    id: "doc-github",
    title: "Docs: GitHub App Setup",
    description:
      "Zero-PAT credential brokering through host Unix domain socket and GitHub App private key",
    category: "Docs",
    tagGroup: "docs",
    url: "/docs/github-app-setup",
    keywords: [
      "github setup",
      "broker",
      "unix socket",
      "pat",
      "pem",
      "tokens",
      "app id",
      "credentials",
    ],
    badge: "DOCS",
    priority: 20,
  },
  {
    id: "doc-tunnel",
    title: "Docs: Cloudflare Tunnel & Anywhere Access",
    description:
      "Local-only port bindings, SSH port-forwarding, Cloudflare Zero Trust, and automatic 0.0.0.0 host binding",
    category: "Docs",
    tagGroup: "docs",
    url: "/docs/cloudflare-tunnel",
    keywords: [
      "cloudflare tunnel",
      "anywhere",
      "remote access",
      "ssh port forward",
      "zero trust",
      "ingress",
    ],
    badge: "DOCS",
    priority: 20,
  },
  {
    id: "doc-cache",
    title: "Docs: Cache & State Backup",
    description:
      "Read-only cache inspection, safe Docker builder cleanup, and portable state archive export/import",
    category: "Docs",
    tagGroup: "docs",
    url: "/docs/cache-and-state",
    keywords: [
      "cache",
      "state",
      "backup",
      "prune",
      "tar.gz",
      "restore",
      "archive",
      "storage",
    ],
    badge: "DOCS",
    priority: 18,
  },
  {
    id: "doc-security",
    title: "Docs: Security Policy & Container Hardening",
    description:
      "Defense-in-depth container isolation, cgroup limits, dropped capabilities, and non-root sandbox UID 1001",
    category: "Docs",
    tagGroup: "docs",
    url: "/docs/security",
    keywords: [
      "security",
      "hardening",
      "capabilities",
      "cgroups",
      "sandbox",
      "uid 1001",
      "isolation",
      "policy",
    ],
    badge: "DOCS",
    priority: 22,
  },
  {
    id: "doc-operations",
    title: "Docs: Operations & Runbook",
    description:
      "DeepSeek Harness lifecycle, safe cache pruning, state archive export/import, updates, and daily runbook",
    category: "Docs",
    tagGroup: "docs",
    url: "/docs/operations",
    keywords: [
      "operations",
      "runbook",
      "production",
      "maintenance",
      "troubleshooting",
      "lifecycle",
    ],
    badge: "DOCS",
    priority: 18,
  },
  {
    id: "doc-contributing",
    title: "Docs: Contributing",
    description:
      "Development workflow, branch conventions, Conventional Commits, shell standards, and PR checklist",
    category: "Docs",
    tagGroup: "docs",
    url: "/docs/contributing",
    keywords: [
      "contributing",
      "git workflow",
      "commits",
      "pr",
      "standards",
      "linting",
      "check",
    ],
    badge: "DOCS",
    priority: 16,
  },

  // ==========================================
  // 5. SITE NAVIGATION & PAGES
  // ==========================================
  {
    id: "nav-home",
    title: "Navigation: Home",
    description:
      "Ai Workstation landing page with system capabilities, architecture, and live telemetry preview",
    category: "Site",
    tagGroup: "site",
    url: "/",
    keywords: ["home", "landing", "root", "main", "welcome", "ai workstation"],
    badge: "PAGE",
    priority: 25,
  },
  {
    id: "nav-console",
    title: "Navigation: Workstation Console",
    description:
      "Direct control console for development environments, container runtimes, and workstation telemetry",
    category: "Site",
    tagGroup: "site",
    url: "/workstation",
    keywords: [
      "console",
      "dashboard",
      "workstation",
      "control",
      "mission control",
    ],
    badge: "PAGE",
    priority: 30,
  },
  {
    id: "nav-docs",
    title: "Navigation: Documentation",
    description:
      "Full documentation guides, host installation instructions, and CLI command reference",
    category: "Site",
    tagGroup: "site",
    url: "/docs",
    keywords: ["docs", "documentation", "guides", "manual", "handbook"],
    badge: "PAGE",
    priority: 24,
  },
  {
    id: "nav-faq",
    title: "Navigation: FAQ",
    description:
      "Frequently Asked Questions about workspace isolation, DSH persistence, and networking",
    category: "Site",
    tagGroup: "site",
    url: "/faq",
    keywords: ["faq", "questions", "answers", "help", "support"],
    badge: "PAGE",
    priority: 22,
  },
  {
    id: "nav-contact",
    title: "Navigation: Contact & Community",
    description:
      "Get in touch with the Ai Workstation engineering and maintenance team",
    category: "Site",
    tagGroup: "site",
    url: "/contact",
    keywords: ["contact", "support", "email", "team", "inquiries"],
    badge: "PAGE",
    priority: 20,
  },
  {
    id: "nav-github",
    title: "External: GitHub Repository",
    description:
      "View source code, commit history, report issues, and star on GitHub",
    category: "Site",
    tagGroup: "site",
    url: "https://github.com/mosabbir-maruf/ai-workstation",
    external: true,
    keywords: ["github", "repository", "source", "code", "issues", "external"],
    badge: "EXTERNAL",
    priority: 20,
  },
  {
    id: "nav-telegram",
    title: "External: Telegram Community",
    description:
      "Join the official Ai Workstation developer community discussions on Telegram",
    category: "Site",
    tagGroup: "site",
    url: "https://t.me/aiws_dev",
    external: true,
    keywords: ["telegram", "chat", "community", "discussions", "external"],
    badge: "EXTERNAL",
    priority: 18,
  },

  // ==========================================
  // 6. LANDING PAGE SECTIONS
  // ==========================================
  {
    id: "landing-features",
    title: "Landing: System Capabilities",
    description:
      "Capability-dropped Docker runtime, persistent DSH state, and zero-PAT GitHub broker",
    category: "Site",
    tagGroup: "site",
    url: "/#features-heading",
    keywords: [
      "capabilities",
      "features",
      "isolated",
      "sandbox",
      "docker",
      "security",
    ],
    badge: "SECTION",
    priority: 15,
  },
  {
    id: "landing-telemetry",
    title: "Landing: Runtime Telemetry",
    description:
      "Real-time CPU dynamics, physical RAM distribution, daemon SLAs, and container throughput",
    category: "Site",
    tagGroup: "site",
    url: "/#telemetry-heading",
    keywords: ["telemetry", "cpu", "ram", "charts", "metrics", "throughput"],
    badge: "SECTION",
    priority: 15,
  },
  {
    id: "landing-how-it-works",
    title: "Landing: How It Works (3-Stage Pipeline)",
    description:
      "Execution pipeline: Host bootstrap (01), Harness daemon (02), and Secure edge ingress (03)",
    category: "Site",
    tagGroup: "site",
    url: "/#how-it-works-heading",
    keywords: [
      "how it works",
      "pipeline",
      "execution phase",
      "bootstrap",
      "ingress",
    ],
    badge: "SECTION",
    priority: 15,
  },
  {
    id: "landing-workflows",
    title: "Landing: Developer Workflows",
    description:
      "Essential CLI workflow recipes: ai use, ai preview, ai run, ai tunnel, ai doctor, ai github",
    category: "Site",
    tagGroup: "site",
    url: "/#workflows-heading",
    keywords: ["workflows", "developer workflows", "commands", "recipes"],
    badge: "SECTION",
    priority: 15,
  },
  {
    id: "landing-faq",
    title: "Landing: Architecture FAQ",
    description:
      "Technical questions on single-project mounting, persistence, and network isolation",
    category: "Site",
    tagGroup: "site",
    url: "/#faq-heading",
    keywords: ["faq", "architecture faq", "questions", "isolation"],
    badge: "SECTION",
    priority: 15,
  },
  {
    id: "landing-tech",
    title: "Landing: Technology Stack & Used By",
    description:
      "Built on Linux cgroups, Docker, Cloudflare Zero Trust, and Next.js",
    category: "Site",
    tagGroup: "site",
    url: "/#used-by",
    keywords: ["stack", "technology", "used by", "partners", "cgroups"],
    badge: "SECTION",
    priority: 12,
  },
];

/**
 * Generate dynamic search items from live workstation context (mounted projects,
 * active branch, preview endpoints, and tunnel hosts).
 */
export function generateDynamicSearchItems(
  ctx: DynamicSearchContext
): GlobalSearchItem[] {
  const dynamicItems: GlobalSearchItem[] = [];

  // Active Project information
  if (ctx.activeProject?.name) {
    const dirtyCount = ctx.activeProject.dirtyFilesCount;
    const dirtyText =
      dirtyCount > 0 ? `${dirtyCount} modified files` : "clean tree";
    const commitText = ctx.activeProject.lastCommitMessage
      ? `Commit: ${ctx.activeProject.lastCommitMessage}`
      : "";

    dynamicItems.push({
      id: "dynamic-active-project",
      title: `Active Project: ${ctx.activeProject.name}`,
      description: `Mounted workspace on branch "${ctx.activeProject.branch}" (${dirtyText}). ${commitText}`.trim(),
      category: "Project",
      tagGroup: "console",
      url: "/workstation?tab=git",
      keywords: [
        "project",
        "active project",
        ctx.activeProject.name,
        ctx.activeProject.branch,
        "workspace",
        "git",
      ],
      badge: "ACTIVE",
      priority: 40,
    });
  }

  // Available mounted projects in ~/projects
  if (ctx.projects && ctx.projects.length > 0) {
    for (const project of ctx.projects) {
      if (!ctx.activeProject || project.name !== ctx.activeProject.name) {
        dynamicItems.push({
          id: `dynamic-project-${project.name}`,
          title: `Project: ${project.name}`,
          description: `Repository in ~/projects. Click to switch active workspace to ${project.name}`,
          category: "Project",
          tagGroup: "console",
          url: "/workstation?tab=projects",
          actionId: `activate-project-${project.name}`,
          keywords: [
            "project",
            "workspace",
            project.name,
            "switch project",
            "use project",
          ],
          badge: "WORKSPACE",
          priority: 25,
        });
      }
    }
  }

  // Live Preview URLs
  if (ctx.preview?.anywhereApp) {
    dynamicItems.push({
      id: "dynamic-preview-app",
      title: `Live Preview: ${ctx.preview.anywhereApp}`,
      description:
        "Active Cloudflare Anywhere edge ingress endpoint for web application",
      category: "Network",
      tagGroup: "console",
      url: ctx.preview.anywhereApp,
      external: true,
      keywords: [
        "preview",
        "url",
        "anywhere",
        "app",
        "preview url",
        ctx.preview.anywhereApp,
      ],
      badge: "LIVE",
      priority: 32,
    });
  }

  if (ctx.preview?.anywhereDsh) {
    dynamicItems.push({
      id: "dynamic-preview-dsh",
      title: `DSH Agent Web: ${ctx.preview.anywhereDsh}`,
      description:
        "Direct edge ingress URL to DeepSeek Harness web dashboard",
      category: "Network",
      tagGroup: "console",
      url: ctx.preview.anywhereDsh,
      external: true,
      keywords: [
        "dsh",
        "harness",
        "preview",
        "url",
        "agent",
        ctx.preview.anywhereDsh,
      ],
      badge: "DSH",
      priority: 28,
    });
  }

  return dynamicItems;
}

interface IndexedSearchItem {
  item: GlobalSearchItem;
  titleLower: string;
  descLower: string;
  keywordsLower: string[];
}

// Pre-computed lowercase fields to avoid repeated string allocations on every keystroke
const INDEXED_CANONICAL_ITEMS: IndexedSearchItem[] = CANONICAL_SEARCH_ITEMS.map(
  (item) => ({
    item,
    titleLower: item.title.toLowerCase(),
    descLower: item.description.toLowerCase(),
    keywordsLower: item.keywords.map((k) => k.toLowerCase()),
  })
);

// Pre-sorted default items for O(1) instantaneous initial dialog presentation
const DEFAULT_CURATED_ITEMS: GlobalSearchItem[] = [...CANONICAL_SEARCH_ITEMS]
  .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  .slice(0, 15);

/**
 * High-performance, zero-dependency search matching and ranking engine.
 * Pre-indexes items once to achieve zero string allocation overhead per keystroke.
 */
export function searchGlobalIndex(
  query: string,
  dynamicCtx?: DynamicSearchContext
): GlobalSearchItem[] {
  const trimmed = query.trim().toLowerCase();

  // Instant O(1) response for empty query
  if (!trimmed) {
    if (dynamicCtx?.activeProject) {
      const dynamicItems = generateDynamicSearchItems(dynamicCtx);
      return [...dynamicItems, ...DEFAULT_CURATED_ITEMS].slice(0, 15);
    }
    return DEFAULT_CURATED_ITEMS;
  }

  const queryTokens = trimmed.split(/\s+/).filter(Boolean);
  const scoredItems: Array<{ item: GlobalSearchItem; score: number }> = [];

  // Index dynamic items when present
  const dynamicIndexed: IndexedSearchItem[] = dynamicCtx
    ? generateDynamicSearchItems(dynamicCtx).map((item) => ({
        item,
        titleLower: item.title.toLowerCase(),
        descLower: item.description.toLowerCase(),
        keywordsLower: item.keywords.map((k) => k.toLowerCase()),
      }))
    : [];

  const candidateItems =
    dynamicIndexed.length > 0
      ? [...dynamicIndexed, ...INDEXED_CANONICAL_ITEMS]
      : INDEXED_CANONICAL_ITEMS;

  for (const { item, titleLower, descLower, keywordsLower } of candidateItems) {
    let score = 0;

    // Exact or prefix title matching
    if (titleLower === trimmed) {
      score += 150;
    } else if (titleLower.startsWith(trimmed)) {
      score += 90;
    } else if (titleLower.includes(trimmed)) {
      score += 50;
    }

    // Token matching across title, keywords, and description with early termination
    let allTokensMatch = true;
    for (const token of queryTokens) {
      let tokenScore = 0;

      if (titleLower.includes(token)) {
        tokenScore += 35;
      }

      for (const kw of keywordsLower) {
        if (kw === token) {
          tokenScore += 30;
          break;
        }
        if (kw.includes(token)) {
          tokenScore += 18;
          break;
        }
      }

      if (descLower.includes(token)) {
        tokenScore += 12;
      }

      if (tokenScore === 0) {
        allTokensMatch = false;
        break;
      }
      score += tokenScore;
    }

    if (allTokensMatch && score > 0) {
      score += item.priority ?? 0;
      scoredItems.push({ item, score });
    }
  }

  scoredItems.sort((a, b) => b.score - a.score);
  return scoredItems.slice(0, 20).map((s) => s.item);
}
