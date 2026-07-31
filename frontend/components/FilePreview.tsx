"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, FileWarning } from "lucide-react";
import { fetchFileBlobUrl } from "@/lib/api";

export function FilePreview({ documentId }: { documentId: string | null }) {
  const [state, setState] = useState<{ url: string; mimeType: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    let objectUrl: string | null = null;
    setState(null);
    setError(null);
    setZoom(100);
    if (!documentId) return;

    fetchFileBlobUrl(documentId)
      .then((result) => {
        objectUrl = result.url;
        setState(result);
      })
      .catch(() => setError("Preview isn't available for this document."));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId]);

  return (
    <div className="panel flex h-full min-h-[480px] flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <span className="field-label">Original Document</span>
        <div className="flex items-center gap-1">
          <ZoomButton Icon={Minus} onClick={() => setZoom((z) => Math.max(40, z - 10))} />
          <span className="w-10 text-center font-mono text-xs text-slate-500">{zoom}%</span>
          <ZoomButton Icon={Plus} onClick={() => setZoom((z) => Math.min(200, z + 10))} />
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-slate-100 p-3">
        {error && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
            <FileWarning size={28} />
            <p className="text-sm">{error}</p>
          </div>
        )}
        {!error && !state && <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading preview…</div>}
        {state && (
          <div style={{ width: `${zoom}%`, transition: "width 0.15s ease" }} className="mx-auto">
            {state.mimeType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={state.url} alt="Document preview" className="w-full rounded border border-slate-200 bg-white shadow-sm" />
            ) : (
              <iframe src={state.url} title="Document preview" className="h-[70vh] w-full rounded border border-slate-200 bg-white shadow-sm" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ZoomButton({ Icon, onClick }: { Icon: typeof Plus; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50">
      <Icon size={12} />
    </button>
  );
}
