import { FormSection, FormFieldDef } from "@/components/FormSection";

export type DocumentSection = {
  title: string;
  fields: FormFieldDef[];
};

export function DocumentDetailPanel({ sections }: { sections: DocumentSection[] }) {
  return (
    <div className="panel h-full p-4">
      <div className="flex flex-col gap-4">
        {sections.map((section) => (
          <FormSection key={section.title} title={section.title} fields={section.fields} />
        ))}
      </div>
    </div>
  );
}
