import Fuse from "fuse.js";
import type { ChatSession } from "./chat-store.ts";

export type SearchBy = "chat" | "ticker";
/** The "All chats" search: a fuzzy query over chat titles or tickers, and a hard ticker filter. */
export type ChatSearch = { query: string; by: SearchBy; tickers: string[] };
export const NO_SEARCH: ChatSearch = { query: "", by: "chat", tickers: [] };

/**
 * Each dashboard tag among `sessions` with its chat count, A–Z. A checked tag with no chats left
 * stays listed (count 0) so it can still be unchecked.
 */
export function tickerCounts(sessions: ChatSession[], labelOf: (s: ChatSession) => string, checked: string[]) {
  const counts = new Map(checked.map(ticker => [ticker, 0]));
  for (const session of sessions) counts.set(labelOf(session), (counts.get(labelOf(session)) ?? 0) + 1);
  return [...counts].map(([ticker, count]) => ({ ticker, count })).sort((a, b) => a.ticker.localeCompare(b.ticker));
}

/**
 * The chats to list: checked tickers narrow the list first (any of them), then a query ranks what
 * is left by match relevance, typos and partial words included. With no query, the given order
 * (newest first) is kept.
 */
export function searchChats(sessions: ChatSession[], labelOf: (s: ChatSession) => string, search: ChatSearch) {
  const checked = new Set(search.tickers);
  const pool = checked.size ? sessions.filter(s => checked.has(labelOf(s))) : sessions;
  const query = search.query.trim();
  if (!query) return pool;
  const items = pool.map(session => ({ session, title: session.title, ticker: labelOf(session) }));
  // ignoreLocation: a match late in a long title counts the same as one at the start
  const fuse = new Fuse(items, { keys: [search.by === "ticker" ? "ticker" : "title"], threshold: 0.4, ignoreLocation: true });
  return fuse.search(query).map(result => result.item.session);
}
