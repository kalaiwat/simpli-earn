"use client";

/** A row of mutually exclusive options (the chat history's "This call / All chats" style) */
export default function Segmented<T extends string>({ label, options, value, onChange }: {
  label: string; options: { value: T; label: string }[]; value: T; onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="grid shrink-0 auto-cols-fr grid-flow-col gap-0.5 rounded-lg border border-white/8 bg-pill p-0.5 text-xs font-medium">
      {options.map(option => (
        <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}
          className={`cursor-pointer truncate rounded-md px-2 py-1 transition-colors ${value === option.value
            ? "bg-accent text-brand" : "text-muted-foreground hover:text-foreground"}`}>
          {option.label}
        </button>
      ))}
    </div>
  );
}
