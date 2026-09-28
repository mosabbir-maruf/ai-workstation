"use client";

import Link from "fumadocs-core/link";
import type * as PageTree from "fumadocs-core/page-tree";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DocsScrollArea } from "@/components/docs/docs-scroll-area";
import { NavLinkLabel } from "@/components/docs/nav-link-label";
import { cn } from "@/lib/utils";

const linkStyles = {
  base: "flex w-fit items-center gap-2 rounded-md px-3 py-1.5 font-medium text-xs no-underline",
  active: "bg-muted text-card-foreground",
  inactive: "text-foreground dark:text-accent-foreground",
  heading:
    "ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 text-muted-foreground font-medium",
};

interface NavLink {
  text: string;
  url: string;
  active?: "url" | "nested-url";
}

interface SidebarProps {
  tree: PageTree.Root;
  links?: NavLink[];
}

function findActivePageTitle(
  nodes: PageTree.Node[],
  pathname: string
): React.ReactNode | null {
  for (const node of nodes) {
    if (node.type === "page" && node.url === pathname) {
      return node.name;
    }
    if (node.type === "folder") {
      if (node.index?.url === pathname) {
        return node.index.name;
      }
      const found = findActivePageTitle(node.children, pathname);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export function Sidebar({ tree, links = [] }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeTitle = findActivePageTitle(tree.children, pathname) ?? "Menu";

  const navContent = (
    <>
      {links.length > 0 && (
        <ul className="m-0 mb-4 list-none space-y-0.5 p-0">
          <li className={linkStyles.heading}>Getting Started</li>
          {links.map((link) => {
            const isActive = pathname === link.url;
            return (
              <li key={link.url}>
                <Link
                  className={cn(
                    linkStyles.base,
                    isActive ? linkStyles.active : linkStyles.inactive
                  )}
                  href={link.url}
                  onClick={() => setMobileOpen(false)}
                >
                  <NavLinkLabel text={link.text} url={link.url} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <div onClick={() => setMobileOpen(false)}>
        <SidebarNodes nodes={tree.children} />
      </div>
    </>
  );

  return (
    <>
      {/* Mobile / Tablet sticky docs navigation bar (< lg) */}
      <div className="sticky top-(--site-header-height) z-30 border-border border-b bg-background/95 backdrop-blur-md lg:hidden">
        <button
          aria-expanded={mobileOpen}
          className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left font-medium text-foreground text-xs sm:px-8"
          onClick={() => setMobileOpen((prev) => !prev)}
          type="button"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              Docs
            </span>
            <span className="text-muted-foreground/50">/</span>
            <span className="truncate font-semibold text-foreground">
              {activeTitle}
            </span>
          </span>
          <svg
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              mobileOpen && "rotate-180"
            )}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {mobileOpen && (
          <nav className="max-h-[70vh] overflow-y-auto overscroll-contain border-border border-t bg-background px-4 py-4 sm:px-8">
            {navContent}
          </nav>
        )}
      </div>

      {/* Desktop fixed left sidebar (lg+) */}
      <aside className="fixed top-(--site-header-height) left-0 hidden h-[calc(100vh-var(--site-header-height))] w-64 overflow-hidden bg-background lg:block">
        <DocsScrollArea className="h-full py-4 pt-16" showEdgeGradient>
          <nav className="px-4 py-8 pl-8">{navContent}</nav>
        </DocsScrollArea>
      </aside>
    </>
  );
}

function SidebarNodes({ nodes }: { nodes: PageTree.Node[] }) {
  return (
    <ul className="m-0 list-none p-0">
      {nodes.map((node, index) => (
        <SidebarNode key={node.$id ?? index} node={node} />
      ))}
    </ul>
  );
}

function SidebarNode({ node }: { node: PageTree.Node }) {
  const pathname = usePathname();

  if (node.type === "separator") {
    return (
      <li className={cn(linkStyles.heading, "mt-4 pt-3 first:mt-0 first:pt-0")}>
        {node.icon}
        <span>{node.name}</span>
      </li>
    );
  }

  if (node.type === "folder") {
    return <SidebarFolder node={node} pathname={pathname} />;
  }

  if (node.type === "page") {
    const isActive = pathname === node.url;
    return (
      <li>
        <Link
          className={cn(
            linkStyles.base,
            isActive ? linkStyles.active : linkStyles.inactive
          )}
          href={node.url}
        >
          {node.icon}
          <span>{node.name}</span>
        </Link>
      </li>
    );
  }

  return null;
}

function SidebarFolder({
  node,
  pathname,
}: {
  node: PageTree.Folder;
  pathname: string;
}) {
  const isChildActive = hasActiveChild(node, pathname);
  const [isOpen, setIsOpen] = useState(node.defaultOpen ?? isChildActive);

  const indexPage = node.index;
  const isIndexActive = indexPage?.url === pathname;

  return (
    <li className="list-none">
      <div className="flex items-center">
        {indexPage ? (
          <Link
            className={cn(
              linkStyles.base,
              isIndexActive ? linkStyles.active : linkStyles.inactive
            )}
            href={indexPage.url}
          >
            {node.icon}
            <span>{node.name}</span>
          </Link>
        ) : (
          <button
            className={cn(linkStyles.base, linkStyles.inactive)}
            onClick={() => setIsOpen(!isOpen)}
            type="button"
          >
            {node.icon}
            <span>{node.name}</span>
          </button>
        )}
        {node.children.length > 0 && (
          <button
            aria-expanded={isOpen}
            aria-label={isOpen ? "Collapse" : "Expand"}
            className="flex size-7 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            type="button"
          >
            <svg
              aria-hidden="true"
              className={`size-4 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        )}
      </div>
      {isOpen && node.children.length > 0 && (
        <div className="ml-3 border-border border-l pl-3">
          <SidebarNodes nodes={node.children} />
        </div>
      )}
    </li>
  );
}

function hasActiveChild(folder: PageTree.Folder, pathname: string): boolean {
  for (const child of folder.children) {
    if (child.type === "page" && child.url === pathname) {
      return true;
    }
    if (child.type === "folder" && hasActiveChild(child, pathname)) {
      return true;
    }
  }
  if (folder.index?.url === pathname) {
    return true;
  }
  return false;
}
