import { FormSection, FormFieldDef } from "@/components/FormSection";

export type DocumentSection = {
  title: string;
  fields: FormFieldDef[];
};

export function DocumentDetailPanel({ sections }: { sections: DocumentSection[] }) {
  const activeSections = sections.filter((s) => s.fields && s.fields.length > 0);

  return (
    <div className="panel flex h-full min-h-0 flex-col p-4">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto">
        {activeSections.length > 0 ? (
          activeSections.map((section) => (
            <FormSection key={section.title} title={section.title} fields={section.fields} />
          ))
        ) : (
          <div className="flex h-full items-center justify-center py-8 text-center text-xs text-slate-400">
            No document metadata fields available.
          </div>
        )}
      </div>
    </div>
  );
}
