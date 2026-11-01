"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import type { ChatController, ChatState } from "@/lib/chat-controller";
import type { ChatSession } from "@/lib/chat-store";
import { chatHref, dashboardTicker, everyChat } from "@/lib/dashboards";
import { useCustomTickers } from "@/lib/use-custom-tickers";

/** This dashboard's chats, or every dashboard's */
export type HistoryScope = "call" | "all";

export default function ChatHistoryList({ controller, state, scope, onScopeChange, onSelect }: {
  controller: ChatController; state: ChatState; scope: HistoryScope; onScopeChange: (scope: HistoryScope) => void;
  onSelect?: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const urlTicker = useSearchParams().get("ticker");
  const customTickers = useCustomTickers();
  const key = controller.source.key;

  // Re-read the other dashboards' chats whenever "All chats" is shown (or this dashboard changes)
  useEffect(() => { if (scope === "all") void controller.loadAll(); }, [scope, controller]);

  // A ticker typed into a custom link wins over the detected one, as on the charts
  const currentTicker = (urlTicker && urlTicker !== "N/A" ? urlTicker.toUpperCase() : null)
    ?? dashboardTicker({ dashboard_id: controller.source.id, video_identifier: controller.source.videoId }, customTickers);
  const tickerOf = (session: ChatSession) =>
    session.dashboard_key === key ? currentTicker : dashboardTicker(session, customTickers);

  const all = scope === "all";
  const sessions = all ? everyChat(state.sessions, state.allSessions ?? [], key) : state.sessions;
  // Only the first list load shows a placeholder; opening a chat must not shift the list
  const listLoading = all ? !state.allSessions : state.loading && !state.sessions.length;

  const open = (session: ChatSession) => {
    if (session.dashboard_key !== key) router.push(chatHref(session, tickerOf(session)));
    else if (state.sessionId !== session.id) void controller.select(session.id);
    onSelect?.();
  };

  return (
    <nav aria-label="Chat history" className="flex h-full min-h-0 flex-col gap-3 text-sm">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <button type="button" className="flex cursor-pointer items-center gap-2 text-brand"
          onClick={() => { controller.newChat(); onSelect?.(); }}><Plus className="size-4" />New chat</button>
        <button type="button" aria-label="Refresh chat history" disabled={state.busy || state.loading}
          className="cursor-pointer disabled:opacity-40" onClick={() => void controller.refresh()}><RefreshCw className="size-3.5" /></button>
      </div>
      <div role="group" aria-label="Show chats from" className="grid shrink-0 grid-cols-2 gap-0.5 rounded-lg border border-white/8 bg-pill p-0.5 text-xs font-medium">
        {(["call", "all"] as const).map(value => (
          <button key={value} type="button" aria-pressed={scope === value} onClick={() => onScopeChange(value)}
            className={`cursor-pointer truncate rounded-md px-2 py-1 transition-colors ${scope === value
              ? "bg-accent text-brand" : "text-muted-foreground hover:text-foreground"}`}>
            {value === "all" ? "All chats" : currentTicker ? `${currentTicker} chats` : "This call"}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-auto">
        {listLoading && <p className="text-xs text-muted-foreground">Loading history…</p>}
        {!listLoading && !sessions.length && <p className="text-xs text-muted-foreground">
          {all ? "No saved chats yet." : "No saved chats for this call."} Send a message to start one.</p>}
        {!listLoading && sessions.map(session => (
          <div key={session.id} className={`relative rounded-lg border p-2 transition-colors ${state.sessionId === session.id
            ? "border-brand/50 bg-white/5" : "border-white/8 hover:bg-white/5"}`}>
            {editing === session.id ? (
              <form onSubmit={async e => {
                e.preventDefault(); if (!title.trim() || saving) return;
                setSaving(true); await controller.rename(session.id, title); setSaving(false); setEditing(null);
              }}>
                <input aria-label="Conversation title" autoFocus maxLength={100} value={title}
                  onChange={e => setTitle(e.target.value)} className="w-full rounded bg-black/40 p-1 text-sm" />
                <div className="mt-2 flex gap-3 text-xs">
                  <button disabled={saving || !title.trim()} className="cursor-pointer text-brand">Save</button>
                  <button type="button" className="cursor-pointer" onClick={() => setEditing(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                {/* The ::after overlay stretches this button across the whole card; the
                    rename/delete buttons sit above it (relative z-10) */}
                <div className="flex items-start gap-2">
                  <button type="button" aria-current={state.sessionId === session.id ? "true" : undefined}
                    className="min-w-0 flex-1 cursor-pointer break-words text-left after:absolute after:inset-0 after:rounded-lg"
                    onClick={() => open(session)}>{session.title}</button>
                  {/* Which dashboard the chat belongs to; same look as the Summary's timestamp pills, compact */}
                  {all && <span className="shrink-0 rounded-md border border-white/8 bg-pill px-1.5 py-0.5 text-[10px] font-medium leading-none text-foreground">
                    {tickerOf(session) ?? "Custom"}</span>}
                </div>
                <div className="mt-2 flex items-center gap-3 text-muted-foreground">
                  <span className="mr-auto text-[10px]">{new Date(session.updated_at).toLocaleDateString()}</span>
                  <button type="button" aria-label={`Rename ${session.title}`} className="relative z-10 cursor-pointer hover:text-foreground"
                    onClick={() => { setEditing(session.id); setTitle(session.title); }}><Pencil className="size-3" /></button>
                  <button type="button" aria-label={`Delete ${session.title}`} className="relative z-10 cursor-pointer hover:text-foreground"
                    onClick={() => setDeleting(session.id)}><Trash2 className="size-3" /></button>
                </div>
              </>
            )}
            {deleting === session.id && (
              <div className="relative z-10 mt-2 text-xs" role="alert">
                <p>Delete this chat and all its messages?</p>
                <div className="mt-2 flex gap-3">
                  <button type="button" disabled={saving} className="cursor-pointer text-red-300" onClick={async () => {
                    setSaving(true); await controller.remove(session.id); setSaving(false); setDeleting(null);
                  }}>Delete</button>
                  <button type="button" className="cursor-pointer" onClick={() => setDeleting(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
