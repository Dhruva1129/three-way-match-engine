"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DocumentRecord, DocumentType } from "@/lib/types";

export function useDocumentsList(poNumber: string | null) {
  return useQuery({
    queryKey: ["documents", poNumber],
    queryFn: () => api.get<Record<DocumentType, DocumentRecord[]>>(`/documents?poNumber=${encodeURIComponent(poNumber as string)}`),
    enabled: !!poNumber,
  });
}

export function useDocument(id: string | null) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: () => api.get<{ documentType: DocumentType; document: DocumentRecord }>(`/documents/${id}`),
    enabled: !!id,
  });
}

export function useUploadDocument(poNumber?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, documentType }: { file: File; documentType: DocumentType }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);
      return api.post<{ document: DocumentRecord; documentType: DocumentType; duplication: { duplicate: boolean; message?: string } }>(
        "/documents/upload",
        formData
      );
    },
    onSuccess: (data) => {
      const linkedPoNumber = data.document.poNumber || poNumber;
      queryClient.invalidateQueries({ queryKey: ["match", linkedPoNumber] });
      queryClient.invalidateQueries({ queryKey: ["summary", linkedPoNumber] });
      queryClient.invalidateQueries({ queryKey: ["documents", linkedPoNumber] });
      queryClient.invalidateQueries({ queryKey: ["poList"] });
    },
  });
}
