import clsx from "clsx";

export function DocumentForm({
  title,
  accent,
  fields,
}: {
  title: string;
  accent: "po" | "grn" | "invoice";
  fields: { label: string; value: string }[];
}) {
  const accentClass = {
    po: "border-l-brand-500",
    grn: "border-l-[#0EA5A0]",
    invoice: "border-l-[#8A5CF6]",
  }[accent];

  return (
    <div className={clsx("panel border-l-4 p-4", accentClass)}>
      <h3 className="mb-3 text-sm font-semibold text-ink-900">{title}</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {fields.map((f) => (
          <div key={f.label}>
            <dt className="field-label">{f.label}</dt>
            <dd className="field-value mt-0.5">{f.value || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
