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
    <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
      <div className="min-w-0">{formPanel}</div>
      <div className="min-h-[480px] min-w-0">{preview}</div>
    </div>
  );
}
