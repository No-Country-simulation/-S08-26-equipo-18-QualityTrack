import { api } from "./api";
import type { Client } from "./clientService";

export interface Request {
  id: number;
  clientId: number;
  client?: Client;
  requestNumber: string;
  title: string;
  description: string;
  receivedAt: string;
  requestedDeliveryDate?: string | null;
  createdById?: number;
  createdAt: string;
  updatedAt: string | null;
}

export type CreateRequestDto = Pick<Request, "clientId" | "requestNumber" | "title" | "description" | "receivedAt" | "requestedDeliveryDate">;
export type UpdateRequestDto = Partial<CreateRequestDto>;

export const requestService = {
  getAll(): Promise<Request[]> {
    return api.get<Request[]>("/requests");
  },
  getById(id: number | string): Promise<Request> {
    return api.get<Request>(`/requests/${id}`);
  },
  create(data: CreateRequestDto): Promise<Request> {
    return api.post<Request>("/requests", data);
  },
  update(id: number | string, data: UpdateRequestDto): Promise<Request> {
    return api.put<Request>(`/requests/${id}`, data);
  },
};

export default requestService;
