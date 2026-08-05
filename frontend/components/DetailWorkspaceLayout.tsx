import { ReactNode } from "react";

/** Shared two-column layout for PO / Fulfillment / Delivery detail views. */
export function DetailWorkspaceLayout({
  formPanel,
  preview,
}: {
  formPanel: ReactNode;
  preview: ReactNode;
}) {
  return (
    <div className="grid min-h-0 grid-cols-1 items-stretch gap-5 min-h-[500px] xl:h-[580px] xl:grid-cols-2 xl:overflow-hidden">
      <div className="min-h-0 min-w-0 h-full">{formPanel}</div>
      <div className="min-h-0 min-w-0 h-full">{preview}</div>
    </div>
  );
}
