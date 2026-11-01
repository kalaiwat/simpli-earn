"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ListFilter, Search, X } from "lucide-react";
import Segmented from "./Segmented";
import type { ChatSearch, SearchBy } from "@/lib/chat-search";

const pill = "border border-white/8 bg-pill";
const SEARCH_BY: { value: SearchBy; label: string }[] = [{ value: "chat", label: "Chat" }, { value: "ticker", label: "Ticker" }];

/**
 * "All chats" search row: a fuzzy search box and a square filter button. The filter menu drops
 * below the row at its full width (the list's left edge to the button's right edge).
 */
export default function ChatHistorySearch({ search, onChange, tickers }: {
  search: ChatSearch; onChange: (search: ChatSearch) => void; tickers: { ticker: string; count: number }[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const checked = new Set(search.tickers);

  // Close on a press anywhere outside the row and its menu
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rowRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  const toggle = (ticker: string) => onChange({ ...search,
    tickers: checked.has(ticker) ? search.tickers.filter(t => t !== ticker) : [...search.tickers, ticker] });

  return (
    // Escape closes the menu only; stopping it here keeps fullscreen SimpliChat open
    <div ref={rowRef} className="relative flex shrink-0 gap-2"
      onKeyDown={e => { if (e.key === "Escape" && menuOpen) { e.stopPropagation(); setMenuOpen(false); } }}>
      <label className={`flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2 text-xs transition-colors focus-within:border-brand/50 ${pill}`}>
        <Search aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
        <input type="search" value={search.query} onChange={e => onChange({ ...search, query: e.target.value })}
          aria-label={search.by === "ticker" ? "Search chats by ticker" : "Search chats"}
          placeholder={search.by === "ticker" ? "Search tickers…" : "Search chats…"}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden" />
        {search.query && <button type="button" aria-label="Clear search" onClick={() => onChange({ ...search, query: "" })}
          className="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"><X className="size-3.5" /></button>}
      </label>
      <button type="button" aria-label={checked.size ? `Filters (${checked.size} tickers)` : "Filters"} aria-expanded={menuOpen}
        aria-haspopup="true" onClick={() => setMenuOpen(open => !open)}
        className={`relative grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg transition-colors hover:border-brand/50 hover:bg-accent hover:text-brand aria-expanded:border-brand/50 aria-expanded:bg-accent aria-expanded:text-brand ${pill} ${
          checked.size ? "text-brand" : "text-foreground"}`}>
        <ListFilter className="size-4" />
        {checked.size > 0 && <span aria-hidden className="absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full bg-brand text-[9px] font-semibold text-background">
          {checked.size}</span>}
      </button>

      {menuOpen && (
        <div className="scrollbar-none absolute inset-x-0 top-full z-30 mt-1.5 max-h-[min(20rem,60vh)] overflow-auto rounded-lg border border-white/15 bg-background p-3 text-xs shadow-xl">
          <p className="mb-1.5 text-muted-foreground">Search by</p>
          <Segmented label="Search by" options={SEARCH_BY} value={search.by} onChange={by => onChange({ ...search, by })} />
          <div className="mt-3 mb-1.5 flex items-center justify-between">
            <p className="text-muted-foreground">Tickers</p>
            <button type="button" disabled={!checked.size} onClick={() => onChange({ ...search, tickers: [] })}
              className="cursor-pointer text-brand disabled:cursor-default disabled:opacity-40">Clear filters</button>
          </div>
          {!tickers.length && <p className="px-2 py-1.5 text-muted-foreground">No chats to filter yet.</p>}
          <div className="space-y-0.5">
            {tickers.map(({ ticker, count }) => (
              <label key={ticker} className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
                checked.has(ticker) ? "bg-accent text-brand" : "hover:bg-white/5"}`}>
                <input type="checkbox" className="peer sr-only" checked={checked.has(ticker)} onChange={() => toggle(ticker)} />
                {/* Drawn checkbox: filled brand square with a tick when checked */}
                <span aria-hidden className={`grid size-3.5 shrink-0 place-items-center rounded-[4px] border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-brand ${
                  checked.has(ticker) ? "border-brand bg-brand text-background" : "border-white/30"}`}>
                  {checked.has(ticker) && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{ticker}</span>
                <span className="tabular-nums text-muted-foreground">{count}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
