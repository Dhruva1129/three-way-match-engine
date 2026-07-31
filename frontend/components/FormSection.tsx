export type FormFieldDef = {
  label: string;
  value?: string;
  placeholder?: string;
  colSpan?: 1 | 2 | 3 | 4 | 5;
};

const SPAN: Record<number, string> = {
  1: "",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
};

export function FormSection({ title, fields }: { title: string; fields: FormFieldDef[] }) {
  if (fields.length === 0) {
    return (
      <section className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
        <div className="mb-2.5 flex items-center gap-2">
          <span className="h-3.5 w-[3px] shrink-0 rounded-sm bg-[#12b76a]" aria-hidden />
          <h4 className="text-sm font-semibold text-ink-900">{title}</h4>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="h-3.5 w-[3px] shrink-0 rounded-sm bg-[#12b76a]" aria-hidden />
        <h4 className="text-sm font-semibold text-ink-900">{title}</h4>
      </div>
      <dl className="grid grid-cols-5 gap-x-3 gap-y-3">
        {fields.map((f) => (
          <div key={f.label} className={SPAN[f.colSpan ?? 1]}>
            <dt className="field-label">{f.label}</dt>
            <dd className="field-value mt-0.5 min-h-[20px]">{f.value ?? f.placeholder ?? ""}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
