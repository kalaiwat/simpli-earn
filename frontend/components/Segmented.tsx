"use client";

import type { ReactNode } from "react";

/**
 * A row of mutually exclusive options (the chat history's "This call / All chats" style). `sm` is
 * the compact, icon-sized version; an option without text needs an `ariaLabel`.
 */
export default function Segmented<T extends string>({ label, options, value, onChange, size = "md" }: {
  label: string; options: { value: T; label: ReactNode; ariaLabel?: string }[]; value: T;
  onChange: (value: T) => void; size?: "md" | "sm";
}) {
  return (
    <div role="group" aria-label={label} className={`grid shrink-0 auto-cols-fr grid-flow-col gap-0.5 border border-white/8 bg-pill p-0.5 text-xs font-medium ${
      size === "sm" ? "rounded-md" : "rounded-lg"}`}>
      {options.map(option => (
        <button key={option.value} type="button" aria-pressed={value === option.value} aria-label={option.ariaLabel}
          title={option.ariaLabel} onClick={() => onChange(option.value)}
          className={`grid min-w-0 cursor-pointer place-items-center truncate transition-colors ${
            size === "sm" ? "rounded-[4px] px-1 py-0.5" : "rounded-md px-2 py-1"} ${value === option.value
            ? "bg-accent text-brand" : "text-muted-foreground hover:text-foreground"}`}>
          {option.label}
        </button>
      ))}
    </div>
  );
}
