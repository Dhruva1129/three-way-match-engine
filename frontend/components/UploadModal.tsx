"use client";

import { useState } from "react";
import { X, UploadCloud, Loader2, CheckCircle2 } from "lucide-react";
import { useUploadDocument } from "@/hooks/useDocuments";
import { DocumentType } from "@/lib/types";
import { ApiError } from "@/lib/api";

export function UploadModal({
  poNumber,
  onClose,
  onSuccess,
}: {
  poNumber: string | null;
  onClose: () => void;
  onSuccess: (poNumber: string) => void;
}) {
  const [files, setFiles] = useState<{ po: File | null; grn: File | null; invoice: File | null }>({
    po: null,
    grn: null,
    invoice: null,
  });
  const [error, setError] = useState<string | null>(null);
  const mutation = useUploadDocument(poNumber);

  const hasAnyFile = files.po || files.grn || files.invoice;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!hasAnyFile) {
      setError("Please select at least one document to upload.");
      return;
    }

    try {
      const uploadPromises: Promise<any>[] = [];
      const types = ["po", "grn", "invoice"] as DocumentType[];

      let finalPoNumber = poNumber;

      for (const type of types) {
        if (files[type]) {
          const promise = mutation.mutateAsync({ file: files[type]!, documentType: type }).then((res) => {
            if (res.document.poNumber) {
              finalPoNumber = res.document.poNumber;
            }
            return res;
          });
          uploadPromises.push(promise);
        }
      }

      await Promise.all(uploadPromises);
      
      if (finalPoNumber) {
        onSuccess(finalPoNumber);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
    }
  }

  function handleFileChange(type: DocumentType, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setFiles((prev) => ({ ...prev, [type]: file }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Upload documents</h2>
            <p className="text-sm text-slate-500">Upload a Purchase Order, GRN, or Invoice.</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(["po", "grn", "invoice"] as DocumentType[]).map((type) => (
              <div key={type}>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {type === "po" ? "Purchase Order" : type}
                </label>
                <label
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-3 py-6 text-center transition-colors ${
                    files[type]
                      ? "border-brand-500 bg-brand-50"
                      : "border-slate-200 hover:border-brand-300 hover:bg-brand-50/30"
                  }`}
                >
                  {files[type] ? (
                    <CheckCircle2 size={24} className="text-brand-500" />
                  ) : (
                    <UploadCloud size={24} className="text-slate-400" />
                  )}
                  <span className="text-xs font-medium text-slate-600 line-clamp-2">
                    {files[type] ? files[type]!.name : "Select file"}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileChange(type, e)}
                  />
                </label>
              </div>
            ))}
          </div>

          {error && <div className="rounded-md bg-bad-50 px-3 py-2 text-sm text-bad-700">{error}</div>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={mutation.isPending || !hasAnyFile}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Uploading & Parsing...
                </>
              ) : (
                "Upload selected documents"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
