import { api } from "./api";
import type { Client } from "./clientService";
import type { Request } from "./requestService";

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
  validUntil?: string;
  createdById?: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateQuotationDto = Omit<
  Quotation,
  "id" | "client" | "request" | "createdAt" | "updatedAt"
>;
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
  delete(id: number | string): Promise<void> {
    return api.delete<void>(`/quotations/${id}`);
  },
};

export default quotationService;
