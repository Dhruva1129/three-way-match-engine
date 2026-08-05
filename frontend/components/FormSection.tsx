export type FormFieldDef = {
  label: string;
  value?: string | number | null;
  colSpan?: 1 | 2 | 3 | 4 | 5;
};

const SPAN: Record<number, string> = {
  1: "",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
};

// List of dummy/placeholder string patterns to filter out if present
const DISALLOWED_VALUES = new Set([
  "",
  "—",
  "-",
  "dd/mm/yyyy",
  "pending",
  "standard",
  "null",
  "undefined",
  "₹0.00",
  "₹0",
]);

export function FormSection({ title, fields }: { title: string; fields: FormFieldDef[] }) {
  // Filter fields to dynamically render ONLY available fields returned from actual document extraction
  const validFields = fields.filter((f) => {
    if (f.value === undefined || f.value === null) return false;
    const strVal = String(f.value).trim();
    if (DISALLOWED_VALUES.has(strVal.toLowerCase()) || DISALLOWED_VALUES.has(strVal)) {
      return false;
    }
    return true;
  });

  // If no valid fields remain for this section, hide the section entirely
  if (validFields.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="h-3.5 w-[3px] shrink-0 rounded-sm bg-brand-500" aria-hidden />
        <h4 className="text-sm font-semibold text-ink-900">{title}</h4>
      </div>
      <dl className="grid grid-cols-5 gap-x-3 gap-y-3">
        {validFields.map((f) => (
          <div key={f.label} className={SPAN[f.colSpan ?? 1]}>
            <dt className="field-label">{f.label}</dt>
            <dd className="field-value mt-0.5 min-h-[20px] font-mono text-xs text-ink-900">
              {String(f.value).trim()}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
