"use client";

import { useDocsSearch } from "fumadocs-core/search/client";
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogListItem,
  SearchDialogOverlay,
  type SearchItemType,
} from "fumadocs-ui/components/dialog/search";
import type { DefaultSearchDialogProps } from "fumadocs-ui/components/dialog/search-default";
import { useI18n } from "fumadocs-ui/contexts/i18n";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type DynamicSearchContext,
  type GlobalSearchItem,
  searchGlobalIndex,
} from "@/lib/search/search-index";
import { cn } from "@/lib/utils";
import { workstationApi } from "@/lib/workstation/api";

type ActionExecutor = () => Promise<unknown>;

/**
 * Declarative dispatch table for executable workstation operations.
 * Eliminates repetitive switch-case logic across sections.
 */
const ACTION_DISPATCH_MAP: Record<
  string,
  { run: ActionExecutor; tab: string }
> = {
  "start-workstation": {
    run: workstationApi.startWorkstation,
    tab: "overview",
  },
  "stop-workstation": {
    run: workstationApi.stopWorkstation,
    tab: "overview",
  },
  "restart-workstation": {
    run: workstationApi.restartWorkstation,
    tab: "overview",
  },
  "run-app": {
    run: workstationApi.appRun,
    tab: "app",
  },
  "stop-app": {
    run: workstationApi.appStop,
    tab: "app",
  },
  "restart-app": {
    run: workstationApi.appRestart,
    tab: "app",
  },
  "git-pull": {
    run: workstationApi.gitPull,
    tab: "git",
  },
  "start-harness": {
    run: workstationApi.harnessStart,
    tab: "harness",
  },
  "stop-harness": {
    run: workstationApi.harnessStop,
    tab: "harness",
  },
  "restart-harness": {
    run: workstationApi.harnessRestart,
    tab: "harness",
  },
  "start-tunnel": {
    run: workstationApi.startTunnel,
    tab: "tunnel",
  },
  "stop-tunnel": {
    run: workstationApi.stopTunnel,
    tab: "tunnel",
  },
  "sync-tunnel": {
    run: workstationApi.syncTunnel,
    tab: "tunnel",
  },
  "test-github": {
    run: workstationApi.testGithub,
    tab: "github",
  },
  "system-doctor": {
    run: workstationApi.systemDoctor,
    tab: "maintenance",
  },
  "system-update": {
    run: workstationApi.systemUpdate,
    tab: "maintenance",
  },
  "system-upgrade": {
    run: workstationApi.systemUpgrade,
    tab: "maintenance",
  },
  "clear-cache": {
    run: () => workstationApi.clearCache(true),
    tab: "maintenance",
  },
};

// Module-level TTL cache to avoid redundant network round-trips on reopening search
let cachedDynamicCtx: DynamicSearchContext | null = null;
let lastDynamicFetchTime = 0;
const DYNAMIC_CACHE_TTL_MS = 30_000;

function SearchItemNode({
  category,
  title,
  description,
  badge,
  actionId,
}: {
  category: string;
  title: string;
  description: string;
  badge?: string;
  actionId?: string;
}) {
  const displayTitle = title.replace(
    new RegExp(`^(?:${category}|Project|Action|Console|Network):\\s*`, "i"),
    ""
  );

  const showBadge = badge && badge.toLowerCase() !== category.toLowerCase();

  return (
    <div className="flex w-full items-start gap-3 py-1 text-left">
      <span className="mt-0.5 w-[72px] shrink-0 rounded border border-border/80 bg-muted/60 py-0.5 text-center font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
        {category}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium text-foreground text-sm leading-snug">
          {displayTitle}
        </span>
        <p className="truncate text-muted-foreground text-xs leading-normal">
          {description}
        </p>
      </div>
      {showBadge ? (
        <span
          className={cn(
            "mt-0.5 shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider tabular-nums",
            actionId
              ? "border-primary/40 bg-primary/10 font-semibold text-primary"
              : "border-border/80 bg-muted/40 text-muted-foreground"
          )}
        >
          {badge}
        </span>
      ) : null}
    </div>
  );
}

export function DocsSearchDialog({
  defaultTag,
  api = "/api/search",
  delayMs,
  type = "fetch",
  links = [],
  footer,
  open,
  onOpenChange,
  ...props
}: DefaultSearchDialogProps) {
  const { locale } = useI18n();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const [dynamicCtx, setDynamicCtx] = useState<DynamicSearchContext | null>(
    () => cachedDynamicCtx
  );

  const customLinkItems = useMemo<GlobalSearchItem[]>(() => {
    if (!links || links.length === 0) return [];
    return links.map(([name, link]) => ({
      id: `custom-link-${name}`,
      title: name,
      description: link,
      category: "Site" as const,
      tagGroup: "site" as const,
      url: link,
      keywords: [name.toLowerCase(), "link"],
      badge: "LINK",
      priority: 15,
    }));
  }, [links]);

  const { search, setSearch, query } = useDocsSearch(
    type === "fetch"
      ? {
          type: "fetch",
          api,
          locale,
          tag: defaultTag,
          delayMs,
        }
      : {
          type: "static",
          from: api,
          locale,
          tag: defaultTag,
          delayMs,
        }
  );

  // Cached, non-blocking background fetch of workstation runtime context
  useEffect(() => {
    if (!open) return;

    const now = Date.now();
    if (cachedDynamicCtx && now - lastDynamicFetchTime < DYNAMIC_CACHE_TTL_MS) {
      setDynamicCtx(cachedDynamicCtx);
      return;
    }

    let mounted = true;
    async function loadDynamicContext() {
      try {
        const [projRes, prevRes] = await Promise.allSettled([
          workstationApi.getProjects(),
          workstationApi.getPreview(),
        ]);
        if (!mounted) return;

        const ctx: DynamicSearchContext = {};
        if (projRes.status === "fulfilled" && projRes.value?.ok) {
          ctx.projects = projRes.value.projects;
          ctx.activeProject = projRes.value.activeProject;
        }
        if (prevRes.status === "fulfilled" && prevRes.value?.ok) {
          ctx.preview = prevRes.value;
        }

        cachedDynamicCtx = ctx;
        lastDynamicFetchTime = Date.now();
        setDynamicCtx(ctx);
      } catch {
        // Silently tolerate backend unavailability
      }
    }

    loadDynamicContext();
    return () => {
      mounted = false;
    };
  }, [open]);

  // Unified action dispatcher with zero code duplication
  const executeAction = useCallback(
    async (actionId: string, item: GlobalSearchItem) => {
      if (actionId === "toggle-theme") {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        return;
      }

      if (actionId.startsWith("activate-project-")) {
        const projectName = actionId.replace("activate-project-", "");
        try {
          await workstationApi.activateProject(projectName);
        } catch {
          // Graceful fallback to projects section
        }
        router.push("/workstation?tab=projects");
        return;
      }

      if (actionId === "export-state") {
        try {
          const res = await workstationApi.exportState();
          if (res.downloadUrl) {
            window.location.href = res.downloadUrl;
          }
        } catch {
          // Fallback to state section
        }
        router.push("/workstation?tab=state");
        return;
      }

      const handler = ACTION_DISPATCH_MAP[actionId];
      if (handler) {
        try {
          await handler.run();
        } catch {
          // Gracefully continue to target section
        }
        router.push(`/workstation?tab=${handler.tab}`);
        return;
      }

      if (item.url) {
        router.push(item.url);
      }
    },
    [router, resolvedTheme, setTheme]
  );

  const handleItemSelect = useCallback(
    (item: GlobalSearchItem) => {
      onOpenChange?.(false);

      if (item.actionId) {
        executeAction(item.actionId, item);
        return;
      }

      if (item.external && item.url) {
        window.open(item.url, "_blank")?.focus();
        return;
      }

      if (item.url) {
        if (
          item.url.includes("#") &&
          window.location.pathname === (item.url.split("#")[0] || "/")
        ) {
          const hash = item.url.split("#")[1];
          if (hash) {
            const el = document.getElementById(hash);
            if (el) {
              el.scrollIntoView({ behavior: "smooth" });
              window.history.pushState({}, "", item.url);
              return;
            }
          }
        }
        router.push(item.url);
      }
    },
    [onOpenChange, executeAction, router]
  );

  // Instantaneous in-memory search results with zero keystroke allocation
  const localResults = useMemo(() => {
    const results = searchGlobalIndex(search, dynamicCtx || undefined);
    if (customLinkItems.length === 0) return results;
    return [...results, ...customLinkItems];
  }, [search, dynamicCtx, customLinkItems]);

  // Combine local instant results with any deep MDX server results from /api/search
  const searchItems: SearchItemType[] = useMemo(() => {
    const items: SearchItemType[] = localResults.map((item) => ({
      type: "action" as const,
      id: item.id,
      node: (
        <SearchItemNode
          actionId={item.actionId}
          badge={item.badge}
          category={item.category}
          description={item.description}
          title={item.title}
        />
      ),
      onSelect: () => handleItemSelect(item),
    }));

    // If server search returned deep heading results from MDX content
    if (Array.isArray(query.data) && query.data.length > 0 && search.trim()) {
      const existingUrls = new Set(localResults.map((r) => r.url));
      for (const doc of query.data) {
        if (!existingUrls.has(doc.url)) {
          items.push({
            type: "action" as const,
            id: `server-${doc.id}`,
            node: (
              <SearchItemNode
                badge="DOCS"
                category="Docs"
                description={
                  doc.breadcrumbs && doc.breadcrumbs.length > 0
                    ? doc.breadcrumbs.join(" / ")
                    : "Documentation section"
                }
                title={String(doc.content)}
              />
            ),
            onSelect: () => {
              onOpenChange?.(false);
              router.push(doc.url);
            },
          });
        }
      }
    }

    return items;
  }, [localResults, query.data, search, handleItemSelect, onOpenChange, router]);

  return (
    <SearchDialog
      isLoading={Boolean(search && query.isLoading && searchItems.length === 0)}
      onOpenChange={onOpenChange}
      onSearchChange={setSearch}
      open={open}
      search={search}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput placeholder="Search console, docs, actions, widgets, projects..." />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList
          Item={({ item, onClick }) => (
            <SearchDialogListItem item={item} onClick={onClick} />
          )}
          items={searchItems}
        />
      </SearchDialogContent>
      {footer ? <SearchDialogFooter>{footer}</SearchDialogFooter> : null}
    </SearchDialog>
  );
}
