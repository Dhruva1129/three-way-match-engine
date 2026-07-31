"use client";

import clsx from "clsx";

export type TopTabKey = "po" | "fulfillment" | "delivery" | "summary";

export function TopTabs({
  active,
  onChange,
  counts,
}: {
  active: TopTabKey;
  onChange: (tab: TopTabKey) => void;
  counts: { po: number; fulfillment: number; delivery: number };
}) {
  const tabs: { key: TopTabKey; label: string; count?: number }[] = [
    { key: "po", label: "Purchase Order", count: counts.po },
    { key: "fulfillment", label: "Fulfillment", count: counts.fulfillment },
    { key: "delivery", label: "Delivery", count: counts.delivery },
    { key: "summary", label: "Summary" },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-slate-200 px-6">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={clsx(
            "relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors",
            active === tab.key ? "text-brand-600" : "text-slate-500 hover:text-slate-700"
          )}
        >
          {tab.label}
          {typeof tab.count === "number" && (
            <span
              className={clsx(
                "rounded-full px-1.5 py-0.5 font-mono text-[11px] leading-none",
                active === tab.key ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500"
              )}
            >
              {tab.count}
            </span>
          )}
          {active === tab.key && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-500" />}
        </button>
      ))}
    </div>
  );
}

export function SubTabPills<T extends { id: string; label: string }>({
  items,
  activeId,
  onChange,
}: {
  items: T[];
  activeId: string | null;
  onChange: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50/60 px-6 py-2.5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={clsx(
            "rounded-full border px-3 py-1 font-mono text-xs font-medium transition-colors",
            activeId === item.id
              ? "border-brand-500 bg-brand-500 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
