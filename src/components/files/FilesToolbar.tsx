"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  FileText,
  Grid2X2,
  Heart,
  Image as ImageIcon,
  LayoutList,
  Loader2,
  Presentation,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TagRecord } from "@/types";

interface FilesToolbarProps {
  query: string;
  type: string;
  sort: string;
  view: "grid" | "list";
  favorite: boolean;
  tag: string;
  folder?: string | null;
  tags: TagRecord[];
  trash?: boolean;
}

const TYPE_FILTERS = [
  { value: "", label: "All", icon: FileText },
  { value: "pdf", label: "PDFs", icon: FileText },
  { value: "document", label: "Docs", icon: FileText },
  { value: "presentation", label: "Decks", icon: Presentation },
  { value: "image", label: "Images", icon: ImageIcon },
  { value: "text", label: "Text", icon: FileText },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Recently added" },
  { value: "name", label: "Name A–Z" },
  { value: "largest", label: "Largest first" },
  { value: "smallest", label: "Smallest first" },
  { value: "type", label: "File type" },
];

export function FilesToolbar({
  query,
  type,
  sort,
  view,
  favorite,
  tag,
  folder = null,
  tags,
  trash = false,
}: FilesToolbarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(query);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setSearch(query);
  }, [query]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  function navigate(overrides: Record<string, string | null>) {
    const params = new URLSearchParams();
    const values: Record<string, string> = {
      q: query,
      type,
      sort,
      view,
      favorite: favorite ? "1" : "",
      tag,
      folder: folder ?? "",
      trash: trash ? "1" : "",
    };

    for (const [key, value] of Object.entries({ ...values, ...overrides })) {
      if (value) params.set(key, value);
    }
    const searchString = params.toString();
    startTransition(() => {
      router.push(searchString ? `/files?${searchString}` : "/files");
    });
  }

  return (
    <div className="space-y-3">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ q: search.trim() || null });
        }}
        className="relative flex items-center"
      >
        <Search className="pointer-events-none absolute left-4 h-4 w-4 text-muted" />
        <input
          type="search"
          value={search}
          onChange={(event) => {
            const value = event.target.value;
            setSearch(value);
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
            debounceRef.current = window.setTimeout(() => {
              const trimmed = value.trim();
              if (trimmed !== query) navigate({ q: trimmed || null });
            }, 450);
          }}
          placeholder="Search by name or text inside documents…"
          aria-label="Search your files"
          className="h-12 w-full rounded-full border-2 border-line bg-surface pl-11 pr-28 text-sm text-ink shadow-toony-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:shadow-none focus:ring-4 focus:ring-primary/15"
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              navigate({ q: null });
            }}
            aria-label="Clear search"
            className="absolute right-[4.6rem] grid h-7 w-7 place-items-center rounded-full text-muted transition hover:bg-surface2 hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-1.5 inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-[#6d5b90]/25 bg-primary px-4 text-xs font-bold text-[#3d3153] transition hover:bg-primary-deep hover:text-white active:translate-y-0.5"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
          Search
        </button>
      </form>

      {/*
        On phones the chips and the sort/view controls each get their own full
        row. Sharing one row squeezed the horizontally-scrolling chip strip into
        a sliver and clipped the filters.
      */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="no-scrollbar -mx-1 flex w-full items-center gap-1.5 overflow-x-auto px-1 pb-0.5 sm:w-auto sm:flex-1">
          {!trash &&
            TYPE_FILTERS.map(({ value, label, icon: Icon }) => {
              const active = type === value;
              return (
                <button
                  key={value || "all"}
                  type="button"
                  onClick={() => navigate({ type: value || null })}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition",
                    active
                      ? "border-primary bg-primary text-[#3d3153]"
                      : "border-line bg-surface text-muted hover:border-primary/40 hover:text-ink"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          {!trash && (
            <button
              type="button"
              onClick={() => navigate({ favorite: favorite ? null : "1" })}
              aria-pressed={favorite}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition",
                favorite
                  ? "border-[#E892A2] bg-[#F7DCE8] text-[#a34b60]"
                  : "border-line bg-surface text-muted hover:border-primary/40 hover:text-ink"
              )}
            >
              <Heart className={cn("h-3.5 w-3.5", favorite && "fill-current")} />
              Favorites
            </button>
          )}
        </div>

        <div className="flex w-full items-center justify-between gap-1.5 sm:w-auto sm:justify-start">
          <label className="relative inline-flex min-w-0 items-center">
            <ArrowUpDown className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted" />
            <span className="sr-only">Sort files</span>
            <select
              value={sort}
              onChange={(event) => navigate({ sort: event.target.value })}
              className="h-9 appearance-none rounded-full border-2 border-line bg-surface pl-8 pr-7 text-xs font-semibold text-ink outline-none transition focus:border-primary"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {tags.length > 0 && !trash && (
            <label className="relative inline-flex items-center">
              <Tag className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted" />
              <span className="sr-only">Filter by tag</span>
              <select
                value={tag}
                onChange={(event) => navigate({ tag: event.target.value || null })}
                className="h-9 max-w-[8.5rem] appearance-none rounded-full border-2 border-line bg-surface pl-8 pr-6 text-xs font-semibold text-ink outline-none transition focus:border-primary"
              >
                <option value="">All tags</option>
                {tags.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="flex items-center rounded-full border-2 border-line bg-surface p-0.5">
            <button
              type="button"
              onClick={() => navigate({ view: "grid" })}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full transition",
                view === "grid" ? "bg-primary/15 text-primary-deep dark:text-primary-soft" : "text-muted hover:text-ink"
              )}
            >
              <Grid2X2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => navigate({ view: "list" })}
              aria-label="List view"
              aria-pressed={view === "list"}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full transition",
                view === "list" ? "bg-primary/15 text-primary-deep dark:text-primary-soft" : "text-muted hover:text-ink"
              )}
            >
              <LayoutList className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {(trash || favorite || tag || type) && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-muted">Active filters:</span>
          {trash && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#E892A2]/15 px-2 py-0.5 font-semibold text-[#a34b60] dark:text-[#f3b3c0]">
              <Trash2 className="h-3 w-3" /> Bin
            </span>
          )}
          {favorite && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F7DCE8] px-2 py-0.5 font-semibold text-[#a34b60]">
              <Heart className="h-3 w-3 fill-current" /> Favorites
            </span>
          )}
          {type && (
            <span className="rounded-full bg-surface2 px-2 py-0.5 font-semibold text-ink">
              {TYPE_FILTERS.find((item) => item.value === type)?.label ?? type}
            </span>
          )}
          {tag && (
            <span className="rounded-full bg-surface2 px-2 py-0.5 font-semibold text-ink">
              {tags.find((item) => item.id === tag)?.name ?? "Tag"}
            </span>
          )}
          <button
            type="button"
            onClick={() =>
              navigate({
                favorite: null,
                tag: null,
                type: null,
                trash: null,
              })
            }
            className="rounded-full px-2 py-0.5 font-semibold text-primary-deep hover:underline dark:text-primary-soft"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
