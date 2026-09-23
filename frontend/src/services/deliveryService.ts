import { api } from "./api";
import type { Client } from "./clientService";
import type { WorkOrder } from "./workOrderService";

export interface Delivery {
  id: number;
  clientId?: number;
  client?: Client;
  workOrderId: number;
  workOrder?: WorkOrder;
  deliveryDate: string;
  quantity: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateDeliveryDto = Omit<
  Delivery,
  "id" | "client" | "workOrder" | "createdAt" | "updatedAt"
>;
export type UpdateDeliveryDto = Partial<CreateDeliveryDto>;

export const deliveryService = {
  getAll(): Promise<Delivery[]> {
    return api.get<Delivery[]>("/deliveries");
  },
  getById(id: number | string): Promise<Delivery> {
    return api.get<Delivery>(`/deliveries/${id}`);
  },
  create(data: CreateDeliveryDto): Promise<Delivery> {
    return api.post<Delivery>("/deliveries", data);
  },
  update(id: number | string, data: UpdateDeliveryDto): Promise<Delivery> {
    return api.put<Delivery>(`/deliveries/${id}`, data);
  },
  delete(id: number | string): Promise<void> {
    return api.delete<void>(`/deliveries/${id}`);
  },
};

export default deliveryService;
