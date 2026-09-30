import { api } from "./api";
import type { WorkOrder } from "./workOrderService";
import type { Request } from "./requestService";
import type { Quotation } from "./quotationService";

export interface DocumentType {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Document {
  id: number;
  workOrderId?: number;
  workOrder?: WorkOrder;
  requestId?: number;
  request?: Request;
  quotationId?: number;
  quotation?: Quotation;
  documentTypeId: number;
  documentType?: DocumentType;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  version: number;
  uploadedById?: number;
  uploadedAt: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateDocumentDto = Omit<
  Document,
  "id" | "workOrder" | "request" | "quotation" | "documentType" | "createdAt" | "updatedAt"
>;
export type UpdateDocumentDto = Partial<CreateDocumentDto>;

export const documentService = {
  getAll(): Promise<Document[]> {
    return api.get<Document[]>("/documents");
  },
  getById(id: number | string): Promise<Document> {
    return api.get<Document>(`/documents/${id}`);
  },
  getByWorkOrder(workOrderId: number | string): Promise<Document[]> {
    return api.get<Document[]>(`/documents/work-order/${workOrderId}`);
  },
  getByRequest(requestId: number | string): Promise<Document[]> {
    return api.get<Document[]>(`/documents/request/${requestId}`);
  },
  getByQuotation(quotationId: number | string): Promise<Document[]> {
    return api.get<Document[]>(`/documents/quotation/${quotationId}`);
  },
  getDocumentTypes(): Promise<DocumentType[]> {
    return api.get<DocumentType[]>("/documents/types");
  },
  upload(data: FormData): Promise<Document> {
    return api.post<Document>("/documents/upload", data);
  },
  delete(id: number | string): Promise<void> {
    return api.delete<void>(`/documents/${id}`);
  },
};

export default documentService;
