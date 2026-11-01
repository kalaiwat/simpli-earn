import type { ChatSession } from "./chat-store.ts";

// Preloaded dashboards (?id=): ticker and call date
export const PRELOADED_DASHBOARDS: Record<string, { ticker: string; date: string }> = {
  "1": { ticker: "AAPL", date: "2/2/25" },
  "2": { ticker: "CVS", date: "11/6/24" },
  "3": { ticker: "GOOGL", date: "2/4/25" },
  "4": { ticker: "SHEL", date: "1/30/25" },
  "5": { ticker: "TSLA", date: "1/29/25" },
  "6": { ticker: "WMT", date: "2/20/25" },
};

type DashboardRef = Pick<ChatSession, "dashboard_id" | "video_identifier">;

/** The ticker of a chat's dashboard: preloaded config, else the custom call's library ticker; null when unknown. */
export function dashboardTicker(ref: DashboardRef, customTickers: ReadonlyMap<string, string>) {
  if (ref.dashboard_id) return PRELOADED_DASHBOARDS[ref.dashboard_id]?.ticker ?? null;
  return ref.video_identifier ? customTickers.get(ref.video_identifier) ?? null : null;
}

/** The dashboard a chat belongs to, opened on that chat. */
export function chatHref(session: ChatSession, ticker: string | null) {
  const params = new URLSearchParams(session.dashboard_id ? { id: session.dashboard_id } : {
    video_url: `https://www.youtube.com/watch?v=${session.video_identifier}`, ...(ticker ? { ticker } : {}),
  });
  params.set("chat", session.id);
  return `/dashboard?${params}`;
}

/**
 * Every chat for the "All chats" list: this dashboard's live list (which includes new chats not
 * saved yet) plus the other dashboards' chats from `all`, newest activity first.
 */
export function everyChat(current: ChatSession[], all: ChatSession[], key: string) {
  const time = (s: ChatSession) => Date.parse(s.updated_at) || 0;
  return [...current, ...all.filter(s => s.dashboard_key !== key)]
    .sort((a, b) => time(b) - time(a) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
