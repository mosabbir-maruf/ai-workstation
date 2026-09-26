export interface Workflow {
  id: string;
  url?: string;
  command: string;
  category: string;
  title: string;
  content: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
    verified?: boolean;
  };
}

/**
 * Masonry uses CSS columns (fill top-to-bottom per column).
 * First 9 entries = top 3 cards in each of the 3 columns on lg screens.
 */
export const workflows: Workflow[] = [
  // Column 1 — Top 3
  {
    id: "cmd-use",
    command: "ai use <project>",
    category: "WORKSPACE",
    title: "Project Hot-Swap",
    content:
      "Instantly switch active workspaces at runtime without restarting containers. Only the selected repository mounts into `/workspace` inside a non-root UID 1001 sandbox.",
    author: {
      name: "Workspace Isolation",
      handle: "@ai use",
      avatar: "",
      verified: true,
    },
  },
  {
    id: "cmd-preview",
    command: "ai preview",
    category: "NETWORKING",
    title: "Auto-Detect Preview",
    content:
      "Automatically probes active dev ports (`5173`, `3000`, `8000`) and prints ready-to-run SSH tunnel commands and loopback URLs.",
    author: {
      name: "Preview Tunnel",
      handle: "@ai preview",
      avatar: "",
      verified: true,
    },
  },
  {
    id: "cmd-github-test",
    command: "ai github test",
    category: "SECURITY",
    title: "Zero-PAT Broker",
    content:
      "Zero PAT or SSH keys inside the container. Git credentials flow on-demand through a host Unix socket (`github.sock`) via a GitHub App key.",
    author: {
      name: "GitHub Broker",
      handle: "@ai github",
      avatar: "",
      verified: true,
    },
  },

  // Column 2 — Top 3
  {
    id: "cmd-run",
    command: "ai run",
    category: "RUNTIME",
    title: "App Daemon Runner",
    content:
      "Starts dev servers with automatic `--host 0.0.0.0` binding so your application is immediately accessible across tunnels without manual config.",
    author: {
      name: "App Runner",
      handle: "@ai run",
      avatar: "",
      verified: true,
    },
  },
  {
    id: "cmd-harness",
    command: "ai harness start",
    category: "AI ENGINE",
    title: "DeepSeek Harness",
    content:
      "Runs DSH locally on `127.0.0.1:4090` bridged to port `4091`. Preserves session memory in `~/.dsh` and packages in `~/.npm-global` outside disposable layers.",
    author: {
      name: "DeepSeek Harness",
      handle: "@ai harness",
      avatar: "",
      verified: true,
    },
  },
  {
    id: "cmd-tunnel",
    command: "ai tunnel setup",
    category: "ACCESS",
    title: "Anywhere Tunnel",
    content:
      "Route preview and DSH through Cloudflare Zero-Trust tunnels. Reach your remote workstation from any browser without opening VPS firewall ports.",
    author: {
      name: "Cloudflare Tunnel",
      handle: "@ai tunnel",
      avatar: "",
      verified: true,
    },
  },

  // Column 3 — Top 3
  {
    id: "cmd-push",
    command: 'ai push "feat: ready"',
    category: "GIT WORKFLOW",
    title: "Secret-Safe Push",
    content:
      "Pre-flight guards inspect staged files for secret leaks (`.env`, `.pem`, `credentials.yaml`) before committing and pushing upstream via fast-forward only.",
    author: {
      name: "Secret-Safe Git",
      handle: "@ai push",
      avatar: "",
      verified: true,
    },
  },
  {
    id: "cmd-cache",
    command: "ai cache clear --deps",
    category: "STORAGE",
    title: "Resource Pruning",
    content:
      "Reclaim gigabytes of stale Docker build cache and project `node_modules` safely without touching persistent DSH history, secrets, or Git repos.",
    author: {
      name: "Cache Maintenance",
      handle: "@ai cache",
      avatar: "",
      verified: true,
    },
  },
  {
    id: "cmd-state",
    command: "ai state export",
    category: "DISASTER RECOVERY",
    title: "State Snapshot",
    content:
      "Bundle full DSH conversations, credentials, and configuration into an encrypted archive for off-site backup or instant restoration onto a new VPS via `ai state import`.",
    author: {
      name: "State Management",
      handle: "@ai state",
      avatar: "",
      verified: true,
    },
  },

  // Additional Rows
  {
    id: "cmd-doctor",
    command: "ai doctor",
    category: "DIAGNOSTICS",
    title: "System Diagnostics",
    content:
      "Runs end-to-end health checks across Docker daemon status, container resource limits, GitHub broker socket permissions (`github.sock`), and host certificate validity.",
    author: {
      name: "Health Doctor",
      handle: "@ai doctor",
      avatar: "",
      verified: true,
    },
  },
  {
    id: "cmd-dsh-update",
    command: "ai dsh update",
    category: "LIFECYCLE",
    title: "Zero-Downtime Upgrade",
    content:
      "Upgrade DeepSeek Harness dynamically in persistent user storage (`runtime/npm-global`) without needing to rebuild or re-pull the base workstation container image.",
    author: {
      name: "DSH Lifecycle",
      handle: "@ai dsh",
      avatar: "",
      verified: true,
    },
  },
  {
    id: "cmd-pull",
    command: "ai pull",
    category: "SYNC",
    title: "Fast-Forward Sync",
    content:
      "Pulls the latest changes from GitHub into the host project repository with strict `git pull --ff-only` verification to prevent accidental branch diverges.",
    author: {
      name: "Git Sync",
      handle: "@ai pull",
      avatar: "",
      verified: true,
    },
  },
];

/** Number of cards visible before "See more" (2 rows × 3 columns). */
export const workflowCollapsedCount = 6;
