import assert from "node:assert/strict";
import { test } from "node:test";
import { NO_SEARCH, searchChats, tickerCounts } from "./chat-search.ts";
import type { ChatSession } from "./chat-store.ts";

const chat = (id: string, title: string, ticker: string): ChatSession => ({ id, title, user_id: "alice",
  dashboard_key: `preloaded:${ticker}`, dashboard_id: ticker, video_identifier: null, created_at: "", updated_at: "" });
// Newest first, as the list arrives
const chats = [
  chat("1", "Guidance for next quarter", "AAPL"),
  chat("2", "Any mention of buybacks or dividend changes?", "TSLA"),
  chat("3", "What drove the gross margin change this quarter?", "AAPL"),
  chat("4", "Capex plans", "GOOGL"),
  chat("5", "Free cash flow", "Video"),
];
const labelOf = (s: ChatSession) => s.dashboard_id!;
const ids = (list: ChatSession[]) => list.map(s => s.id);

test("no query and no filter keeps the newest-first order", () => {
  assert.deepEqual(ids(searchChats(chats, labelOf, NO_SEARCH)), ["1", "2", "3", "4", "5"]);
  assert.deepEqual(ids(searchChats(chats, labelOf, { ...NO_SEARCH, query: "   " })), ["1", "2", "3", "4", "5"]);
});

test("chat search tolerates typos and partial words, best match first", () => {
  assert.deepEqual(ids(searchChats(chats, labelOf, { ...NO_SEARCH, query: "guidnace" })), ["1"]);
  assert.deepEqual(ids(searchChats(chats, labelOf, { ...NO_SEARCH, query: "buyb" })), ["2"]);
  assert.equal(ids(searchChats(chats, labelOf, { ...NO_SEARCH, query: "margin" }))[0], "3");
  assert.deepEqual(ids(searchChats(chats, labelOf, { ...NO_SEARCH, query: "xyzzy plugh" })), []);
});

test("ticker search matches tags, not titles", () => {
  assert.deepEqual(ids(searchChats(chats, labelOf, { ...NO_SEARCH, by: "ticker", query: "aapl" })), ["1", "3"]);
  assert.deepEqual(ids(searchChats(chats, labelOf, { ...NO_SEARCH, by: "ticker", query: "GOGL" })), ["4"]);
  assert.deepEqual(ids(searchChats(chats, labelOf, { ...NO_SEARCH, by: "ticker", query: "capex" })), []);
});

test("the ticker filter is OR across checked tickers and narrows before search ranks", () => {
  assert.deepEqual(ids(searchChats(chats, labelOf, { ...NO_SEARCH, tickers: ["AAPL", "Video"] })), ["1", "3", "5"]);
  assert.deepEqual(ids(searchChats(chats, labelOf, { ...NO_SEARCH, tickers: ["TSLA"], query: "quarter" })), []);
  assert.deepEqual(ids(searchChats(chats, labelOf, { ...NO_SEARCH, tickers: ["AAPL"], query: "quarter" })).sort(), ["1", "3"]);
});

test("ticker counts come from the chats, A–Z, keeping checked tickers that have none left", () => {
  assert.deepEqual(tickerCounts(chats, labelOf, []), [
    { ticker: "AAPL", count: 2 }, { ticker: "GOOGL", count: 1 }, { ticker: "TSLA", count: 1 }, { ticker: "Video", count: 1 }]);
  assert.deepEqual(tickerCounts([], labelOf, ["WMT"]), [{ ticker: "WMT", count: 0 }]);
});
