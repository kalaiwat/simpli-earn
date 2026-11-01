"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Check, ListFilter, Search, X } from "lucide-react";
import Segmented from "./Segmented";
import type { ChatSearch, SearchBy, SortDir, SortKey } from "@/lib/chat-search";

const pill = "border border-white/8 bg-pill";
const SEARCH_BY: { value: SearchBy; label: string }[] = [{ value: "chat", label: "Chat" }, { value: "ticker", label: "Ticker" }];
// Each sort's name, and what ascending / descending mean for it
const SORT_BY: { key: SortKey; label: string; asc: string; desc: string }[] = [
  { key: "updated", label: "Last active", asc: "Least recently active first", desc: "Most recently active first" },
  { key: "created", label: "Date created", asc: "Oldest first", desc: "Newest first" },
  { key: "length", label: "Length", asc: "Shortest first", desc: "Longest first" },
  { key: "ticker", label: "Ticker", asc: "A to Z", desc: "Z to A" },
  { key: "title", label: "Title", asc: "A to Z", desc: "Z to A" },
];

/**
 * "All chats" search row: a fuzzy search box and a square filter button. The filter menu fades in
 * below the row at its full width (the list's left edge to the button's right edge).
 */
export default function ChatHistorySearch({ search, onChange, tickers }: {
  search: ChatSearch; onChange: (search: ChatSearch) => void; tickers: { ticker: string; count: number }[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const checked = new Set(search.tickers);

  // Close on a press anywhere but the menu and its button, the search box included
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  const toggleTicker = (ticker: string) => onChange({ ...search,
    tickers: checked.has(ticker) ? search.tickers.filter(t => t !== ticker) : [...search.tickers, ticker] });
  const toggleSort = (key: SortKey) => onChange({ ...search,
    sorts: search.sorts.includes(key) ? search.sorts.filter(k => k !== key) : [...search.sorts, key] });
  // Picking a direction also turns that sort on
  const setDir = (key: SortKey, dir: SortDir) => onChange({ ...search, dirs: { ...search.dirs, [key]: dir },
    sorts: search.sorts.includes(key) ? search.sorts : [...search.sorts, key] });

  return (
    // Escape closes the menu only; stopping it here keeps fullscreen SimpliChat open
    <div className="relative flex shrink-0 gap-2"
      onKeyDown={e => { if (e.key === "Escape" && menuOpen) { e.stopPropagation(); setMenuOpen(false); } }}>
      <label className={`flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2 text-xs transition-colors focus-within:border-brand/50 ${pill}`}>
        <Search aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
        <input type="search" value={search.query} onChange={e => onChange({ ...search, query: e.target.value })}
          onFocus={() => setMenuOpen(false)}
          aria-label={search.by === "ticker" ? "Search chats by ticker" : "Search chats"}
          placeholder={search.by === "ticker" ? "Search tickers…" : "Search chats…"}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden" />
        {search.query && <button type="button" aria-label="Clear search" onClick={() => onChange({ ...search, query: "" })}
          className="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"><X className="size-3.5" /></button>}
      </label>
      <button ref={buttonRef} type="button" aria-label={checked.size ? `Filters (${checked.size} tickers)` : "Filters"}
        aria-expanded={menuOpen} aria-haspopup="true" onClick={() => setMenuOpen(open => !open)}
        className={`relative grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg transition-colors hover:border-brand/50 hover:bg-accent hover:text-brand aria-expanded:border-brand/50 aria-expanded:bg-accent aria-expanded:text-brand ${pill} ${
          checked.size ? "text-brand" : "text-foreground"}`}>
        <ListFilter className="size-4" />
        {checked.size > 0 && <span aria-hidden className="absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full bg-brand text-[9px] font-semibold text-background">
          {checked.size}</span>}
      </button>

      {/* Stays mounted so it can fade out; invisible once faded, so it can't be focused or clicked */}
      <div ref={menuRef} className={`absolute inset-x-0 top-full z-30 mt-1.5 flex max-h-[min(30rem,70vh)] flex-col rounded-lg border border-white/15 bg-background p-3 text-xs shadow-xl transition-[opacity,visibility] duration-150 motion-reduce:transition-none ${
        menuOpen ? "visible opacity-100" : "invisible opacity-0"}`}>
        {/* Search by and Sort by keep their size; only the ticker list scrolls */}
        <Heading>Search by</Heading>
        <Segmented label="Search by" options={SEARCH_BY} value={search.by} onChange={by => onChange({ ...search, by })} />

        <Heading className="mt-3">Sort by</Heading>
        <div className="shrink-0 space-y-0.5">
          {SORT_BY.map(sort => {
            const position = search.sorts.indexOf(sort.key);
            return (
              <div key={sort.key} className={`flex items-center rounded-md pr-2 transition-colors ${position >= 0 ? "bg-accent text-brand" : "hover:bg-white/5"}`}>
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-2 py-1.5">
                  {/* With several sorts on, the box shows each one's priority: the first groups the list */}
                  <CheckBox checked={position >= 0} onChange={() => toggleSort(sort.key)}>
                    {search.sorts.length > 1 && position >= 0 ? <span className="text-[9px] font-semibold">{position + 1}</span> : undefined}
                  </CheckBox>
                  <span className="min-w-0 flex-1 truncate font-medium">{sort.label}</span>
                </label>
                <Segmented size="sm" label={`${sort.label} direction`} value={search.dirs[sort.key]} onChange={dir => setDir(sort.key, dir)}
                  options={[{ value: "asc", label: <ArrowUp className="size-3" />, ariaLabel: sort.asc },
                    { value: "desc", label: <ArrowDown className="size-3" />, ariaLabel: sort.desc }]} />
              </div>
            );
          })}
        </div>

        <div className="mt-3 mb-1.5 flex shrink-0 items-center justify-between px-2">
          <p className="text-muted-foreground">Tickers</p>
          <button type="button" disabled={!checked.size} onClick={() => { onChange({ ...search, tickers: [] }); setMenuOpen(false); }}
            className="cursor-pointer text-brand disabled:cursor-default disabled:opacity-40">Clear filters</button>
        </div>
        {!tickers.length && <p className="px-2 py-1.5 text-muted-foreground">No chats to filter yet.</p>}
        <div className="scrollbar-none min-h-0 space-y-0.5 overflow-auto">
          {tickers.map(({ ticker, count }) => (
            <label key={ticker} className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
              checked.has(ticker) ? "bg-accent text-brand" : "hover:bg-white/5"}`}>
              <CheckBox checked={checked.has(ticker)} onChange={() => toggleTicker(ticker)} />
              <span className="min-w-0 flex-1 truncate font-medium">{ticker}</span>
              <span className="tabular-nums text-muted-foreground">{count}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function Heading({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`mb-1.5 shrink-0 px-2 text-muted-foreground ${className}`}>{children}</p>;
}

/** A real checkbox, drawn as a brand-filled square with a tick (or `children`) when checked */
function CheckBox({ checked, onChange, children }: { checked: boolean; onChange: () => void; children?: ReactNode }) {
  return (
    <>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />
      <span aria-hidden className={`grid size-3.5 shrink-0 place-items-center rounded-[4px] border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-brand ${
        checked ? "border-brand bg-brand text-background" : "border-white/30"}`}>
        {checked && (children ?? <Check className="size-3" strokeWidth={3} />)}
      </span>
    </>
  );
}
