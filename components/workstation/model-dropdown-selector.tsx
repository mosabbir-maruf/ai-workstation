"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface ModelDropdownSelectorProps {
  models: string[];
  selectedModel: string;
  onSelect: (model: string) => void;
  placeholder?: string;
  className?: string;
}

export function ModelDropdownSelector({
  models,
  selectedModel,
  onSelect,
  placeholder = "Select an available model...",
  className,
}: ModelDropdownSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow render
      const t = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const filteredModels = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return models;
    return models.filter((m) => m.toLowerCase().includes(q));
  }, [models, search]);

  const displayText = selectedModel || placeholder;

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex h-8 w-full items-center justify-between gap-2 rounded border border-border/80 bg-background/80 px-2.5 font-mono text-xs text-foreground transition-all hover:bg-muted/40 hover:border-foreground/30 focus:outline-none focus:ring-1 focus:ring-ring",
          isOpen && "ring-1 ring-ring border-foreground/40 bg-muted/30"
        )}
      >
        <span className={cn("truncate text-left", !selectedModel && "text-muted-foreground/70")}>
          {displayText}
        </span>
        <svg
          className={cn(
            "size-3.5 text-muted-foreground shrink-0 transition-transform duration-200",
            isOpen && "rotate-180 text-foreground"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Custom Themed Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Search input for filtering */}
          {models.length > 5 && (
            <div className="p-1.5 border-b border-border/50">
              <div className="relative flex items-center">
                <svg
                  className="absolute left-2 size-3 text-muted-foreground pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${models.length} models...`}
                  className="h-7 w-full rounded bg-muted/40 pl-7 pr-7 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 outline-none focus:bg-muted/60 focus:ring-1 focus:ring-ring"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between px-1 pt-1 text-[10px] font-mono text-muted-foreground/70">
                <span>
                  Showing {filteredModels.length} of {models.length}
                </span>
                {search && <span>Filter: &quot;{search}&quot;</span>}
              </div>
            </div>
          )}

          {/* Scrollable Model List */}
          <div className="max-h-52 overflow-y-auto p-1 space-y-0.5">
            {filteredModels.length === 0 ? (
              <div className="py-4 text-center text-xs font-mono text-muted-foreground/70">
                No matching models found
              </div>
            ) : (
              filteredModels.map((m) => {
                const isSelected = m === selectedModel;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      onSelect(m);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-xs font-mono transition-colors",
                      isSelected
                        ? "bg-accent text-accent-foreground font-semibold"
                        : "text-foreground hover:bg-muted/60"
                    )}
                  >
                    <span className="truncate">{m}</span>
                    {isSelected && (
                      <svg
                        className="size-3.5 text-emerald-500 shrink-0 ml-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
