import { api } from "./api";
export interface DocumentType {
  id: number;
  name: string;
  description?: string | null;
}
export interface Document {
  id: number;
  workOrderId?: number | null;
  requestId?: number | null;
  quotationId?: number | null;
  documentTypeId: number;
  documentType?: DocumentType;
  fileName: string;
  mimeType: string;
  fileSize: number;
  version: number;
  uploadedById?: number;
  uploadedBy?: { id: number; firstName: string; lastName: string };
  uploadedAt: string;
  description?: string | null;
  downloadAvailable?: boolean;
}
export interface DocumentConfig {
  maxFileSize: number;
  allowedExtensions: string[];
}
export const documentService = {
  getAll: () => api.get<Document[]>("/documents"),
  getById: (id: number | string) => api.get<Document>(`/documents/${id}`),
  getByWorkOrder: (id: number | string) =>
    api.get<Document[]>(`/documents/work-order/${id}`),
  getByRequest: (id: number | string) =>
    api.get<Document[]>(`/documents/request/${id}`),
  getByQuotation: (id: number | string) =>
    api.get<Document[]>(`/documents/quotation/${id}`),
  getDocumentTypes: () => api.get<DocumentType[]>("/documents/types"),
  getConfig: () => api.get<DocumentConfig>("/documents/config"),
  upload: (data: FormData) =>
    api.post<Document>("/documents/upload", data, {
      headers: { "Content-Type": null },
    }),
  download: (id: number | string) =>
    api.get<Blob>(`/documents/${id}/download`, { responseType: "blob" }),
};
export function saveDocumentFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default documentService;
