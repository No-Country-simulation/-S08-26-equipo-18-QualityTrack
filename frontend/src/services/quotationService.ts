import { api } from "./api";
import type { Client } from "./clientService";
import type { Request } from "./requestService";

export interface QuotationItem {
  id?: number;
  quotationId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string | null;
}

export interface Quotation {
  id: number;
  clientId: number;
  client?: Client;
  requestId: number;
  request?: Request;
  quotationNumber: string;
  version: number;
  description: string;
  subtotal: string;
  taxAmount: string;
  currency: string;
  validUntil?: string | null;
  items?: QuotationItem[];
  createdById?: number;
  createdAt: string;
  updatedAt: string | null;
  total?: string;
  decisionStatus?: "pending" | "accepted" | "rejected";
  decidedAt?: string | null;
  decidedById?: number | null;
  decidedBy?: { id: number; firstName: string; lastName: string } | null;
}

export type CreateQuotationDto = Pick<Quotation, "clientId" | "requestId" | "quotationNumber" | "version" | "description" | "currency" | "validUntil"> & {
  items: Pick<QuotationItem, "description" | "quantity" | "unitPrice" | "notes">[];
};
export type UpdateQuotationDto = Partial<CreateQuotationDto>;

export const quotationService = {
  getAll(): Promise<Quotation[]> {
    return api.get<Quotation[]>("/quotations");
  },
  getById(id: number | string): Promise<Quotation> {
    return api.get<Quotation>(`/quotations/${id}`);
  },
  create(data: CreateQuotationDto): Promise<Quotation> {
    return api.post<Quotation>("/quotations", data);
  },
  update(id: number | string, data: UpdateQuotationDto): Promise<Quotation> {
    return api.put<Quotation>(`/quotations/${id}`, data);
  },
  decide(id: number | string, status: "accepted" | "rejected"): Promise<Quotation> {
    return api.patch<Quotation>(`/quotations/${id}/decision`, { status });
  },
};

export default quotationService;
